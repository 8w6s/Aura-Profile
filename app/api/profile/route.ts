import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/utils/supabase';

type LooseProfile = Record<string, unknown>;

type Revision = {
  id: string;
  createdAt: string;
  type: 'publish' | 'rollback';
  snapshot: LooseProfile;
};

type WorkflowMeta = {
  draft?: LooseProfile;
  revisions?: Revision[];
  updatedAt?: string;
  publishedAt?: string;
};

type ProfileStore = LooseProfile & {
  _workflow?: WorkflowMeta;
};

type ProfileAction = 'saveDraft' | 'publish' | 'rollback';

const MAX_REVISIONS = 20;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readStore = async (): Promise<ProfileStore> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profile_data')
      .select('content')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      console.warn('Could not read from Supabase profile_data:', error.message);
      return {};
    }
    return (data?.content || {}) as ProfileStore;
  } catch (err) {
    console.error('Error in readStore:', err);
    return {};
  }
};

const writeStore = async (store: ProfileStore) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('profile_data')
      .upsert({ id: 'main', content: store }, { onConflict: 'id' });

    if (error) {
      console.error('Error in writeStore:', error.message);
      let errMsg = error.message;
      if (errMsg.includes('schema cache') || errMsg.includes('does not exist')) {
        errMsg = "Database table 'profile_data' is missing or schema cache is stale. Please copy and run the SQL from the /setup page in your Supabase SQL Editor.";
      }
      return new Error(errMsg);
    }
  } catch (err) {
    console.error('Error in writeStore exception:', err);
    return err instanceof Error ? err : new Error(String(err));
  }
};

const getPublishedProfile = (store: ProfileStore): LooseProfile => {
  const published = { ...store };
  delete (published as ProfileStore)._workflow;
  return published;
};

const ensureWorkflow = (store: ProfileStore): WorkflowMeta => ({
  draft: store._workflow?.draft,
  revisions: store._workflow?.revisions || [],
  updatedAt: store._workflow?.updatedAt,
  publishedAt: store._workflow?.publishedAt,
});

const validateProfilePayload = (profile: unknown): profile is LooseProfile => {
  if (!isObject(profile)) {
    return false;
  }

  const requiredStringFields = ['name', 'role', 'avatarUrl', 'bannerUrl', 'bio'];
  for (const field of requiredStringFields) {
    const value = profile[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      return false;
    }
  }

  if (!Array.isArray(profile.socials) || !Array.isArray(profile.posts) || !Array.isArray(profile.playlist)) {
    return false;
  }

  return true;
};

const preserveRuntimeMetrics = (incomingProfile: LooseProfile, existingPublished: LooseProfile): LooseProfile => {
  const merged = { ...incomingProfile };

  if (isObject(existingPublished.stats)) {
    merged.stats = existingPublished.stats;
  }

  const incomingPosts = Array.isArray(incomingProfile.posts) ? incomingProfile.posts : [];
  const existingPosts = Array.isArray(existingPublished.posts) ? existingPublished.posts : [];

  merged.posts = incomingPosts.map((post) => {
    if (!isObject(post)) {
      return post;
    }

    const existingPost = existingPosts.find((currentPost) =>
      isObject(currentPost) && currentPost.id === post.id
    );

    if (!isObject(existingPost)) {
      return {
        ...post,
        likes: Number(post.likes || 0),
        views: Number(post.views || 0),
        comments: Array.isArray(post.comments) ? post.comments : [],
        viewedIps: Array.isArray(post.viewedIps) ? post.viewedIps : [],
        likedIps: Array.isArray(post.likedIps) ? post.likedIps : [],
      };
    }

    return {
      ...post,
      likes: Number(existingPost.likes || 0),
      views: Number(existingPost.views || 0),
      comments: Array.isArray(existingPost.comments) ? existingPost.comments : [],
      viewedIps: Array.isArray(existingPost.viewedIps) ? existingPost.viewedIps : [],
      likedIps: Array.isArray(existingPost.likedIps) ? existingPost.likedIps : [],
    };
  });

  const incomingFiles = Array.isArray(incomingProfile.files) ? incomingProfile.files : [];
  const existingFiles = Array.isArray(existingPublished.files) ? existingPublished.files : [];
  merged.files = incomingFiles.map((file) => {
    if (!isObject(file)) {
      return file;
    }

    const existingFile = existingFiles.find((currentFile) =>
      isObject(currentFile) && currentFile.id === file.id
    );

    return {
      ...file,
      downloadCount: Number(isObject(existingFile) ? existingFile.downloadCount : file.downloadCount || 0),
    };
  });

  return merged;
};

const buildRevision = (type: Revision['type'], snapshot: LooseProfile): Revision => ({
  id: `rev-${Date.now()}`,
  createdAt: new Date().toISOString(),
  type,
  snapshot,
});

const requireAdmin = (_request: Request) => {
  // Temporary bypass for now, to be replaced by full Supabase auth check
  return { ok: true as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
};

export async function GET(request: Request) {
  try {
    const store = await readStore();
    const publishedProfile = getPublishedProfile(store);
    const url = new URL(request.url);
    const adminMode = url.searchParams.get('mode') === 'admin';

    if (adminMode) {
      const auth = requireAdmin(request);
      if (!auth.ok) {
        return auth.response;
      }

      const workflow = ensureWorkflow(store);
      return NextResponse.json({
        profile: workflow.draft && validateProfilePayload(workflow.draft)
          ? workflow.draft
          : publishedProfile,
        workflow: {
          revisions: (workflow.revisions || []).map((revision) => ({
            id: revision.id,
            createdAt: revision.createdAt,
            type: revision.type,
          })),
          updatedAt: workflow.updatedAt || null,
          publishedAt: workflow.publishedAt || null,
        },
      });
    }

    if (Object.keys(publishedProfile).length > 0) {
      return NextResponse.json(publishedProfile);
    }

    return NextResponse.json({}, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return auth.response;
    }

    const payload = await request.json() as { action?: ProfileAction; profile?: unknown; revisionId?: string } | LooseProfile;
    const action = isObject(payload) && typeof payload.action === 'string'
      ? payload.action as ProfileAction
      : 'saveDraft';

    const store = await readStore();
    const publishedProfile = getPublishedProfile(store);
    const workflow = ensureWorkflow(store);

    if (action === 'saveDraft') {
      const incomingProfile = isObject(payload) && 'profile' in payload ? payload.profile : payload;
      if (!validateProfilePayload(incomingProfile)) {
        return NextResponse.json({ error: 'Invalid profile payload' }, { status: 400 });
      }

      const draft = preserveRuntimeMetrics(incomingProfile, publishedProfile);
      const nextStore: ProfileStore = {
        ...publishedProfile,
        _workflow: {
          ...workflow,
          draft,
          updatedAt: new Date().toISOString(),
        },
      };

      const writeError = await writeStore(nextStore);
      if (writeError) {
        return NextResponse.json({ error: 'Failed to write draft to Supabase: ' + writeError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action,
        profile: draft,
        workflow: {
          revisions: (nextStore._workflow?.revisions || []).map((revision) => ({
            id: revision.id,
            createdAt: revision.createdAt,
            type: revision.type,
          })),
          updatedAt: nextStore._workflow?.updatedAt || null,
          publishedAt: nextStore._workflow?.publishedAt || null,
        },
      });
    }

    if (action === 'publish') {
      let sourceDraft = workflow.draft;

      // Fallback in case saveDraft failed initially or DB was empty but they clicked saveAndPublish
      if (!sourceDraft || !validateProfilePayload(sourceDraft)) {
         sourceDraft = publishedProfile;
      }

      if (!sourceDraft || Object.keys(sourceDraft).length === 0) {
        return NextResponse.json({ error: 'No valid draft to publish. Please save a draft first or check the profile_data table configuration.' }, { status: 400 });
      }

      const nextPublishedProfile = preserveRuntimeMetrics(sourceDraft, publishedProfile);
      const nextRevisions = [...(workflow.revisions || []), buildRevision('publish', publishedProfile)]
        .slice(-MAX_REVISIONS);

      const nextStore: ProfileStore = {
        ...nextPublishedProfile,
        _workflow: {
          ...workflow,
          draft: nextPublishedProfile,
          revisions: nextRevisions,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const writeError = await writeStore(nextStore);
      if (writeError) {
         return NextResponse.json({ error: 'Failed to publish to Supabase: ' + writeError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action,
        profile: nextPublishedProfile,
        workflow: {
          revisions: nextRevisions.map((revision) => ({
            id: revision.id,
            createdAt: revision.createdAt,
            type: revision.type,
          })),
          updatedAt: nextStore._workflow?.updatedAt || null,
          publishedAt: nextStore._workflow?.publishedAt || null,
        },
      });
    }

    if (action === 'rollback') {
      const revisionId = isObject(payload) && typeof payload.revisionId === 'string' ? payload.revisionId : '';
      if (!revisionId) {
        return NextResponse.json({ error: 'revisionId is required for rollback' }, { status: 400 });
      }

      const targetRevision = (workflow.revisions || []).find((revision) => revision.id === revisionId);
      if (!targetRevision || !validateProfilePayload(targetRevision.snapshot)) {
        return NextResponse.json({ error: 'Revision not found or invalid' }, { status: 404 });
      }

      const rollbackProfile = preserveRuntimeMetrics(targetRevision.snapshot, publishedProfile);
      const nextRevisions = [
        ...(workflow.revisions || []),
        buildRevision('rollback', publishedProfile),
      ].slice(-MAX_REVISIONS);

      const nextStore: ProfileStore = {
        ...rollbackProfile,
        _workflow: {
          ...workflow,
          draft: rollbackProfile,
          revisions: nextRevisions,
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      const writeError = await writeStore(nextStore);
      if (writeError) {
         return NextResponse.json({ error: 'Failed to rollback on Supabase: ' + writeError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action,
        profile: rollbackProfile,
        workflow: {
          revisions: nextRevisions.map((revision) => ({
            id: revision.id,
            createdAt: revision.createdAt,
            type: revision.type,
          })),
          updatedAt: nextStore._workflow?.updatedAt || null,
          publishedAt: nextStore._workflow?.publishedAt || null,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to save profile data' }, { status: 500 });
  }
}
