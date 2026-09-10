$jobs = [ordered]@{
    '8.jpg'  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Vasily_Perov_-_%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%A4.%D0%9C.%D0%94%D0%BE%D1%81%D1%82%D0%BE%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_-_Google_Art_Project.jpg/500px-Vasily_Perov_-_%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%A4.%D0%9C.%D0%94%D0%BE%D1%81%D1%82%D0%BE%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_-_Google_Art_Project.jpg'
    '9.jpg'  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Dickens_Gurney_head.jpg/500px-Dickens_Gurney_head.jpg'
    '14.jpg' = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/F._Scott_Fitzgerald_%281921_portrait_-_crop%29_Retouched.jpg/500px-F._Scott_Fitzgerald_%281921_portrait_-_crop%29_Retouched.jpg'
    '17.jpg' = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Jorge_Luis_Borges_1951%2C_by_Grete_Stern_%28full%29.jpg/500px-Jorge_Luis_Borges_1951%2C_by_Grete_Stern_%28full%29.jpg'
    '20.jpg' = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Mary_Wollstonecraft_Shelley_Rothwell.tif/lossy-page1-500px-Mary_Wollstonecraft_Shelley_Rothwell.tif.jpg'
}
foreach ($k in $jobs.Keys) {
    curl.exe -sS -L --fail --retry 2 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" -o ("public\giants\" + $k) $jobs[$k]
    if ($LASTEXITCODE -eq 0) { Write-Output ("OK   " + $k) } else { Write-Output ("FAIL " + $k + " exit=" + $LASTEXITCODE) }
    Start-Sleep -Milliseconds 800
}