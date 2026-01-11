find / -name "appointmentController.js" -maxdepth 5 2>/dev/null > /tmp/app_location.txt
pm2 list > /tmp/pm2_list.txt 2>&1 || echo "PM2 not found" > /tmp/pm2_list.txt
