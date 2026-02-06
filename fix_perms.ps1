$path = "c:\Users\mateo\Documents\BoardWave\boardwave-final.pem"
# Reset permissions
$acl = Get-Acl $path
$acl.SetAccessRuleProtection($true, $false) # Disable inheritance, remove existing rules
$owner = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME,"FullControl","Allow")
$acl.AddAccessRule($owner)
Set-Acl $path $acl
Write-Host "Permissions fixed for $path"
