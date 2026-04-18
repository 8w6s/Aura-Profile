# Quản lý Bug & Cải trở dự án

## Mục tiêu chính
- ✅ Fix toàn bộ lỗi ẩn (SSR mismatch, undefined variables).
- ⬜ Chạy ESLint để dọn dẹp các warnings (any types, dead code/unused imports).
- ✅ Đảm bảo code 100% tiếng Anh cho giao diện (global).
- ✅ Rà soát toàn bộ project để gỡ rối các tính năng gãy như Theme Quick Presets, Hydration Mismatch.

## Danh sách Công việc (Tasks)
- [x] Sửa lỗi Hydration Mismatch (do browser extensions thêm thuộc tính bis_skin_checked, hoặc sai cú pháp SSR) trong layout.tsx và page.tsx.
- [x] Xoá bỏ biến disableCustomCursor gây lỗi không xác định tại page.tsx.
- [x] Dò toàn bộ file trong project để xoá bỏ các mã tiếng Việt tàn dư.
- [x] Khắc phục triệt để lỗi bị rollback dữ liệu (áp dụng bộ màu Theme Quick Presets).
- [x] Sửa lỗi Typewriter bio không hoạt động.
- [ ] Deploy lên VPS và kiểm tra trạng thái clone, build thành công với Github (v1.0.0.patch2).

## Kế hoạch thực thi
1. ✅ Viết xong TODO.md để bám sát dự án.
2. ⬜ Kiểm tra lỗi ESLint, fix warnings.
3. ✅ Rà soát lỗi lỗi Theme Quick Preset ở /app/admin/page.tsx.
4. ✅ Check và update Typewriter Bio.
5. ✅ Kiểm tra mã Tiếng Việt trong component và cấu trúc UI để xoá sạch.

## Tasks mới (Session 2026-04-18)
- [ ] Add comprehensive error handling to API routes
- [ ] Clean unused imports and dead code (ESLint)
- [ ] Add input validation to all API endpoints
- [ ] Test build and verify all features
- [ ] Document decisions in context-store.json
