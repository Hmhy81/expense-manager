Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\wamp64\www\nodejs\expense-manager"
WshShell.Run "cmd /c node build\bin\server.js", 0, True
