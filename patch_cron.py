with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

find = """          console.warn('Daily scheduled backup to Google Drive failed:', err);
          setDriveNotification({
            type: 'error',
            message: `দৈনিক Google Drive স্বয়ংক্রিয় ব্যাকআপ ব্যর্থ হয়েছে: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`,
          });"""

repl = """          console.warn('Daily scheduled backup to Google Drive failed:', err);
          logAudit(
            'SECURITY_ALERT',
            'Google Drive Backup',
            `দৈনিক Google Drive স্বয়ংক্রিয় ব্যাকআপ ব্যর্থ হয়েছে: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`
          );
          setDriveNotification({
            type: 'error',
            message: `দৈনিক Google Drive স্বয়ংক্রিয় ব্যাকআপ ব্যর্থ হয়েছে: ${err?.message || 'নেটওয়ার্ক ত্রুটি'}`,
          });"""

content = content.replace(find, repl)

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
