import re

with open('src/context/ERPContext.tsx', 'r') as f:
    content = f.read()

if "import { encryptData } from '../utils/cryptoUtils';" not in content:
    content = content.replace("import { initialUsers, initialRoles, INITIAL_COMPANY_SETTINGS, INITIAL_PRODUCTION_RECIPES, INITIAL_ASSETS, INITIAL_ASSET_CATEGORIES } from '../data/initialData';", 
    "import { initialUsers, initialRoles, INITIAL_COMPANY_SETTINGS, INITIAL_PRODUCTION_RECIPES, INITIAL_ASSETS, INITIAL_ASSET_CATEGORIES } from '../data/initialData';\nimport { encryptData } from '../utils/cryptoUtils';")

# Find the end of ERPProvider setup (e.g. before `// Return the Context Provider`)
target_string = "  return (\n    <ERPContext.Provider"
auto_backup_code = """  // --------------------------------------------------------------------------
  // DAILY AUTO-BACKUP (ENCRYPTED JSON)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const checkAndRunAutoBackup = () => {
      try {
        const lastBackupDate = localStorage.getItem('food_erp_last_auto_backup_date');
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        if (lastBackupDate !== today) {
          // Trigger the backup
          const dataStr = exportDatabaseJSON();
          // Encrypt it
          const encryptedData = encryptData(dataStr);
          
          const blob = new Blob([encryptedData], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Food_ERP_Auto_Backup_${today}.json.enc`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          // Save the date so it doesn't trigger again today
          localStorage.setItem('food_erp_last_auto_backup_date', today);
        }
      } catch (err) {
        console.error('Auto-backup failed:', err);
      }
    };

    // Run this once after 5 seconds to not block initial render
    const timeout = setTimeout(checkAndRunAutoBackup, 5000);
    return () => clearTimeout(timeout);
  }, []);

"""

content = content.replace(target_string, auto_backup_code + target_string)

with open('src/context/ERPContext.tsx', 'w') as f:
    f.write(content)
