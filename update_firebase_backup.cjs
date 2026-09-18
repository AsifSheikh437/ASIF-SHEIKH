const fs = require('fs');

let content = fs.readFileSync('src/context/ERPContext.tsx', 'utf8');

if (!content.includes('import { uploadBackupToFirebase }')) {
  content = content.replace(
    "import { formatBDT",
    "import { uploadBackupToFirebase } from '../services/firebaseService';\nimport { formatBDT"
  );
}

// Add state for last firebase backup
if (!content.includes('const [lastFirebaseBackupTime, setLastFirebaseBackupTime]')) {
  content = content.replace(
    "  const [driveBackupsList, setDriveBackupsList] = useState<DriveBackupFile[]>([]);",
    "  const [driveBackupsList, setDriveBackupsList] = useState<DriveBackupFile[]>([]);\n  const [lastFirebaseBackupTime, setLastFirebaseBackupTime] = useState<string | null>(null);"
  );
}

const firebaseBackupLogic = `
  // Scheduled daily automatic Firebase Storage backup
  useEffect(() => {
    const checkFirebaseDailyBackup = async () => {
      const todayStr = new Date().toISOString().substring(0, 10);
      const lastFirebaseBackup = localStorage.getItem('food_erp_last_firebase_backup_date');
      
      if (lastFirebaseBackup !== todayStr) {
        try {
          const dataJson = exportDatabaseJSON();
          const company = settings.companyNameEnglish?.replace(/[^a-zA-Z0-9]/g, '') || 'FoodERP';
          const filename = \`\${company}_DailyBackup_\${todayStr}.json\`;
          
          console.log('Initiating automated daily backup to Firebase Storage...');
          const url = await uploadBackupToFirebase(dataJson, filename);
          
          localStorage.setItem('food_erp_last_firebase_backup_date', todayStr);
          setLastFirebaseBackupTime(new Date().toISOString());
          
          logAudit(
            'EXPORT',
            'Firebase Storage Backup',
            \`দৈনিক স্বয়ংক্রিয় ব্যাকআপ Firebase Storage-এ সফলভাবে সম্পন্ন: \${filename}\`
          );
          
          // Optional: we can share notification or let it be silent
          console.log('Firebase Daily Backup Successful:', url);
        } catch (err: any) {
          console.warn('Daily scheduled backup to Firebase Storage failed:', err);
        }
      }
    };
    
    // Slight delay to ensure context is fully loaded before backup
    const timer = setTimeout(() => {
      checkFirebaseDailyBackup();
    }, 15000); // 15 seconds after app load
    
    return () => clearTimeout(timer);
  }, [settings.companyNameEnglish]); // Re-run if settings load
`;

if (!content.includes('checkFirebaseDailyBackup')) {
  content = content.replace(
    "  // Scheduled daily automatic backup check",
    firebaseBackupLogic + "\n  // Scheduled daily automatic backup check"
  );
  
  fs.writeFileSync('src/context/ERPContext.tsx', content);
  console.log('Updated ERPContext.tsx with Firebase Daily Backup.');
}
