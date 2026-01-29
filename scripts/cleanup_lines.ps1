$API_BASE = "http://localhost:8000/api"

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/state" -Method Get
    if (-not $response) {
        Write-Host "Failed to fetch state."
        exit
    }

    $lines = $response.lines
    Write-Host "Found $($lines.Count) lines."

    if ($lines.Count -le 1) {
        Write-Host "Only 1 or fewer lines exist. No cleanup needed."
        exit
    }

    # Keep the first one (index 0), delete the rest
    for ($i = 1; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $id = $line.id
        $name = $line.name
        Write-Host "Deleting $name (ID: $id)..."
        
        try {
            Invoke-RestMethod -Uri "$API_BASE/lines/$id" -Method Delete
            Write-Host "Successfully deleted $name"
        } catch {
            Write-Host "Failed to delete $name : $_"
        }
    }
    
    Write-Host "Cleanup complete."
} catch {
    Write-Host "Error: $_"
}
