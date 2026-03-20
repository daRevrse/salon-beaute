const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/auth/Register.js");
let content = fs.readFileSync(filePath, "utf8");

// 1. Replace BUSINESS_TYPES with SECTOR_CONFIGS
const sectorConfigs = `// Sector config mapping
const SECTOR_CONFIGS = {
  coiffure: { icon: ScissorsIcon, gradient: "from-violet-500 to-violet-600", lightBg: "bg-violet-50", borderColor: "border-violet-500", textColor: "text-violet-600" },
  barbier: { icon: SparklesIcon, gradient: "from-indigo-500 to-blue-600", lightBg: "bg-indigo-50", borderColor: "border-indigo-500", textColor: "text-indigo-600" },
  institut: { icon: HeartIcon, gradient: "from-pink-500 to-rose-500", lightBg: "bg-pink-50", borderColor: "border-pink-500", textColor: "text-pink-600" },
  spa: { icon: SparklesIcon, gradient: "from-teal-400 to-emerald-500", lightBg: "bg-teal-50", borderColor: "border-teal-500", textColor: "text-teal-600" },
  onglerie: { icon: UserIcon, gradient: "from-fuchsia-500 to-purple-600", lightBg: "bg-fuchsia-50", borderColor: "border-fuchsia-500", textColor: "text-fuchsia-600" },
  massage: { icon: SparklesIcon, gradient: "from-orange-400 to-red-500", lightBg: "bg-orange-50", borderColor: "border-orange-500", textColor: "text-orange-600" },
  medical: { icon: HeartIcon, gradient: "from-cyan-500 to-blue-500", lightBg: "bg-cyan-50", borderColor: "border-cyan-500", textColor: "text-cyan-600" },
  restaurant: { icon: BuildingStorefrontIcon, gradient: "from-amber-400 to-orange-500", lightBg: "bg-amber-50", borderColor: "border-amber-500", textColor: "text-amber-600" },
  training: { icon: AcademicCapIcon, gradient: "from-emerald-500 to-green-600", lightBg: "bg-emerald-50", borderColor: "border-emerald-500", textColor: "text-emerald-600" },
  other: { icon: Squares2X2Icon, gradient: "from-slate-400 to-gray-500", lightBg: "bg-slate-50", borderColor: "border-slate-500", textColor: "text-slate-600" },
  default: { icon: BuildingStorefrontIcon, gradient: "from-violet-500 to-indigo-600", lightBg: "bg-violet-50", borderColor: "border-violet-500", textColor: "text-violet-600" }
};`;

content = content.replace(/\/\/ Business Types Configuration[\s\S]*?\];/m, sectorConfigs);

// 2. Add businessTypes state and fetch
if (!content.includes("const [businessTypes, setBusinessTypes] = useState([]);")) {
  content = content.replace('  const [googleUserData, setGoogleUserData] = useState(null);',
    '  const [googleUserData, setGoogleUserData] = useState(null);\n\n  const [businessTypes, setBusinessTypes] = useState([]);\n\n  useEffect(() => {\n    fetch(`${process.env.REACT_APP_API_URL}/public/business-sectors`)\n      .then(res => res.json())\n      .then(data => {\n        if (data.success) {\n          const types = data.sectors.map(s => {\n            const config = SECTOR_CONFIGS[s.value] || SECTOR_CONFIGS.default;\n            return {\n              id: s.value,\n              name: s.label,\n              description: "",\n              comingSoon: !s.is_active,\n              ...config\n            };\n          });\n          setBusinessTypes(types);\n        }\n      })\n      .catch(console.error);\n  }, []);');
}

// 3. Update selectBusinessType
content = content.replace('const type = BUSINESS_TYPES.find((bt) => bt.id === typeId);', 'const type = businessTypes.find((bt) => bt.id === typeId);');

// 4. Update currentBusinessType
content = content.replace('const currentBusinessType = BUSINESS_TYPES.find(', 'const currentBusinessType = businessTypes.find(');

// 5. Update BUSINESS_TYPES.map
content = content.replace(/BUSINESS_TYPES\.map/g, 'businessTypes.map');
content = content.replace('className="grid grid-cols-1 md:grid-cols-2 gap-4"', 'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"');

fs.writeFileSync(filePath, content);
console.log("Patched Register.js");
