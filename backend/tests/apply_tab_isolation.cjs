const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../src");

function updateFile(relPath, fn) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error("File not found:", fullPath);
    return;
  }
  const oldContent = fs.readFileSync(fullPath, "utf8");
  const newContent = fn(oldContent);
  if (oldContent !== newContent) {
    fs.writeFileSync(fullPath, newContent, "utf8");
    console.log(`Updated: ${relPath}`);
  } else {
    console.log(`No changes needed for: ${relPath}`);
  }
}

// 1. FinanceProvider.jsx
updateFile("context/FinanceProvider.jsx", (content) => {
  // Add import if not present
  if (!content.includes("import { getAuthToken, getAuthUser }")) {
    content = 'import { getAuthToken, getAuthUser } from "../utils/authStorage.js";\n' + content;
  }

  // Replace userData state
  content = content.replace(
    /const \[userData, setUserData\] = useState\(\(\) => {[\s\S]*?try {[\s\S]*?const localUser = localStorage\.getItem\("financeos_user"\);[\s\S]*?return null;\s*}\s*catch[\s\S]*?return null;\s*}\s*}\);/,
    `const [userData, setUserData] = useState(() => {\n    try {\n      return getAuthUser();\n    } catch (error) {\n      console.error("Unable to load logged-in FinanceOS user:", error);\n      return null;\n    }\n  });`
  );

  // Replace all token getters
  // Single line
  content = content.replace(
    /const token =\s*localStorage\.getItem\("financeos_token"\)\s*\|\|\s*sessionStorage\.getItem\("financeos_token"\);/g,
    "const token = getAuthToken();"
  );
  // Multi-line
  content = content.replace(
    /localStorage\.getItem\("financeos_token"\)\s*\|\|\s*sessionStorage\.getItem\("financeos_token"\)/g,
    "getAuthToken()"
  );

  return content;
});

// Helper for other files to replace both single-line and multi-line fallback patterns
function replaceStoragePatterns(content) {
  // Replace token fallbacks with sessionStorage
  content = content.replace(
    /localStorage\.getItem\(\s*["']financeos_token["']\s*\)\s*\|\|\s*sessionStorage\.getItem\(\s*["']financeos_token["']\s*\)/g,
    'sessionStorage.getItem("financeos_token")'
  );
  // Replace user fallbacks with sessionStorage
  content = content.replace(
    /localStorage\.getItem\(\s*["']financeos_user["']\s*\)\s*\|\|\s*sessionStorage\.getItem\(\s*["']financeos_user["']\s*\)/g,
    'sessionStorage.getItem("financeos_user")'
  );
  // Remove standalone localStorage removals for auth tokens/users on logout
  content = content.replace(
    /localStorage\.removeItem\(\s*["']financeos_token["']\s*\);\s*/g,
    ""
  );
  content = content.replace(
    /localStorage\.removeItem\(\s*["']financeos_user["']\s*\);\s*/g,
    ""
  );
  return content;
}

// 2. Sidebar.jsx & AdminSidebar.jsx
updateFile("components/layout/Sidebar.jsx", (c) => replaceStoragePatterns(c));
updateFile("components/AdminSidebar.jsx", (c) => replaceStoragePatterns(c));

// 3. Protected routes
updateFile("components/auth/ProtectedRoute.jsx", (c) => replaceStoragePatterns(c));
updateFile("components/auth/AdminProtectedRoute.jsx", (c) => replaceStoragePatterns(c));

// 4. MonthlyFinanceForm.jsx
updateFile("components/monthlyFinance/MonthlyFinanceForm.jsx", (c) => {
  return c.replace(
    /localStorage\.getItem\(\s*["']financeos_token["']\s*\)\s*\|\|\s*sessionStorage\.getItem\(\s*["']financeos_token["']\s*\)/g,
    'sessionStorage.getItem("financeos_token")'
  );
});

// 5. Admin pages
const adminPages = [
  "pages/AdminActivity.jsx",
  "pages/AdminCreateUser.jsx",
  "pages/AdminDashboard.jsx",
  "pages/AdminEditUser.jsx",
  "pages/AdminMessages.jsx",
  "pages/AdminProfile.jsx",
  "pages/AdminReminders.jsx",
  "pages/AdminReports.jsx",
  "pages/AdminUserAccess.jsx",
  "pages/AdminUserDetails.jsx",
  "pages/AdminUsers.jsx",
  "pages/Profile.jsx",
  "pages/Reports.jsx",
];

adminPages.forEach((p) => {
  updateFile(p, (c) => {
    c = replaceStoragePatterns(c);
    // In Profile.jsx / AdminProfile.jsx, fix profile update persistence
    c = c.replace(
      /if \(localStorage\.getItem\("financeos_token"\)\) {[\s\S]*?localStorage\.setItem\("financeos_user", JSON\.stringify\(updatedUser\)\);[\s\S]*?}/,
      'sessionStorage.setItem("financeos_user", JSON.stringify(updatedUser));'
    );
    return c;
  });
});

console.log("Migration complete.");
