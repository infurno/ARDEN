/**
 * Tokyo Night Theme Configuration for ARDEN
 * 
 * Official Tokyo Night color palettes for both dark and light modes
 * Source: https://github.com/tokyo-night/tokyo-night-vscode-theme
 */

// Tokyo Night Dark & Storm Colors
const tokyoNightDark = {
    // Accent Colors
    red: '#f7768e',
    orange: '#ff9e64',
    yellow: '#e0af68',
    green: '#9ece6a',
    teal: '#73daca',
    cyan: '#7dcfff',
    blue: '#7aa2f7',
    purple: '#bb9af7',
    
    // Text Colors
    textPrimary: '#c0caf5',
    textSecondary: '#9aa5ce',
    textTertiary: '#565f89',
    
    // Background Colors
    background: '#1a1b26',
    surface: '#24283b',
    darker: '#16161e',
    border: '#414868',
    
    // Terminal Colors
    terminalBlack: '#414868',
    terminalRed: '#f7768e',
    terminalGreen: '#73daca',
    terminalYellow: '#e0af68',
    terminalBlue: '#7aa2f7',
    terminalMagenta: '#bb9af7',
    terminalCyan: '#7dcfff',
    terminalWhite: '#c0caf5'
};

// Tokyo Night Light (Day) Colors
const tokyoNightLight = {
    // Accent Colors
    red: '#8c4351',
    orange: '#965027',
    yellow: '#8f5e15',
    green: '#385f0d',
    teal: '#33635c',
    cyan: '#0f4b6e',
    blue: '#2959aa',
    purple: '#5a3e8e',
    
    // Text Colors
    textPrimary: '#343b58',
    textSecondary: '#565f89',
    textTertiary: '#6c6e75',
    
    // Background Colors
    background: '#d5d6db',
    surface: '#e1e2e7',
    lighter: '#e6e7ed',
    border: '#a8aecb',
    
    // Terminal Colors
    terminalBlack: '#343B58',
    terminalRed: '#8c4351',
    terminalGreen: '#33635c',
    terminalYellow: '#8f5e15',
    terminalBlue: '#2959aa',
    terminalMagenta: '#5a3e8e',
    terminalCyan: '#0f4b6e',
    terminalWhite: '#343b58'
};

// Tailwind Configuration for Tokyo Night
const tokyoNightTailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Semantic color names that work in both modes
                tokyo: {
                    // Accent colors (same names, different values per mode)
                    'red': tokyoNightDark.red,
                    'red-light': tokyoNightLight.red,
                    'orange': tokyoNightDark.orange,
                    'orange-light': tokyoNightLight.orange,
                    'yellow': tokyoNightDark.yellow,
                    'yellow-light': tokyoNightLight.yellow,
                    'green': tokyoNightDark.green,
                    'green-light': tokyoNightLight.green,
                    'teal': tokyoNightDark.teal,
                    'teal-light': tokyoNightLight.teal,
                    'cyan': tokyoNightDark.cyan,
                    'cyan-light': tokyoNightLight.cyan,
                    'blue': tokyoNightDark.blue,
                    'blue-light': tokyoNightLight.blue,
                    'purple': tokyoNightDark.purple,
                    'purple-light': tokyoNightLight.purple,
                    
                    // Background colors
                    'bg': tokyoNightDark.background,
                    'bg-light': tokyoNightLight.background,
                    'surface': tokyoNightDark.surface,
                    'surface-light': tokyoNightLight.surface,
                    'border': tokyoNightDark.border,
                    'border-light': tokyoNightLight.border,
                    
                    // Text colors
                    'text': tokyoNightDark.textPrimary,
                    'text-light': tokyoNightLight.textPrimary,
                    'text-secondary': tokyoNightDark.textSecondary,
                    'text-secondary-light': tokyoNightLight.textSecondary,
                    'text-tertiary': tokyoNightDark.textTertiary,
                    'text-tertiary-light': tokyoNightLight.textTertiary,
                },
                
                // Legacy color names for backward compatibility
                primary: tokyoNightDark.blue,
                secondary: tokyoNightDark.purple,
                accent: tokyoNightDark.green,
                danger: tokyoNightDark.red,
                warning: tokyoNightDark.yellow,
                background: tokyoNightDark.background,
                surface: tokyoNightDark.surface,
                border: tokyoNightDark.border,
            }
        }
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokyoNightDark, tokyoNightLight, tokyoNightTailwindConfig };
}
