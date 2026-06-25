@echo off
echo ===================================================
echo MENG-UPDATE WEBSITE CREATOR HUB AI...
echo ===================================================
cd /d "d:\Aplikasi StoryBoard"

echo.
echo Menyimpan semua perubahan baru...
git add .

echo.
echo Mengamankan kode...
git commit -m "Auto-update website %date%"

echo.
echo Mengirim ke server GitHub dan Vercel...
git push

echo.
echo ===================================================
echo BERHASIL! SEMUA PERUBAHAN TELAH DIKIRIM.
echo Silakan tunggu sekitar 1 menit, website Vercel Anda 
echo akan otomatis ter-update.
echo ===================================================
pause
