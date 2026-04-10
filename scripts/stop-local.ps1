$ErrorActionPreference = "Stop"

foreach ($port in 3000, 8000) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
        foreach ($connection in $connections) {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction Stop
            Write-Host "Stopped process $($connection.OwningProcess) on port $port"
        }
    } catch {
        Write-Host "Nothing listening on port $port"
    }
}
