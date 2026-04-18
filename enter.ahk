#Requires AutoHotkey v2.0
#SingleInstance Force

; Tự động chạy với quyền Admin (để bấm được vào Terminal)
if !A_IsAdmin {
    Run('*RunAs "' A_ScriptFullPath '"')
    ExitApp()
}

MsgBox("F8: Chạy | F9: Dừng | Esc: Thoát hẳn")

; Nhấn F8 để bắt đầu
F8:: {
    SetTimer(SendEnter, 2000) 
    ToolTip("Macro ENTER đang CHẠY (10s/lần)")
    SetTimer(() => ToolTip(), -3000)
}

; Nhấn F9 để tạm dừng
F9:: {
    SetTimer(SendEnter, 0)
    ToolTip("Macro ENTER đã DỪNG")
    SetTimer(() => ToolTip(), -3000)
}

; Thoát script hoàn toàn
Esc::ExitApp()

SendEnter() {
    ; Kiểm tra nếu cửa sổ hiện tại là Terminal, PowerShell hoặc CMD thì mới bấm
    if WinActive("ahk_exe WindowsTerminal.exe") or WinActive("ahk_exe powershell.exe") or WinActive("ahk_exe cmd.exe") {
        Send("{Enter}")
    }
}
