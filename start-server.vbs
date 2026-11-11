Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\wamp64\www\nodejs\expense-manager"
WshShell.Run "cmd /c ""C:\Program Files\nodejs\node.exe"" build\bin\server.js", 0, False
