#!/bin/bash
msg=${1:-"auto commit"}

# اضافه کردن همه تغییرات
git add .

# ساختن کامیت موقت با پیام دلخواه یا پیشفرض
git commit -m "$msg"

# گرفتن تغییرات ریموت و مرتب‌سازی تاریخچه
git pull origin main --rebase

# پوش کردن به گیت‌هاب
git push origin main
