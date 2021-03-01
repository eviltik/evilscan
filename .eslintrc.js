module.exports = {
    'extends': 'eslint:recommended',
    'env': {
        'node': true,
        'browser': false,
        'es6': true
    },
    'parserOptions': {
        'ecmaVersion': 2018,
        'sourceType': 'module'
    },
    'rules': {
        'linebreak-style':2,
        'comma-dangle': ['error', 'only-multiline'],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'eol-last': ['error', 'always'],
        'indent': ['error', 4, { 'MemberExpression': 1 }],
        'no-multiple-empty-lines': ['error'],
        'no-new-symbol': 'error',
        'no-trailing-spaces': ['error'],
        'no-undef': ['error'],
        'no-unused-vars': ['error'],
        'object-curly-spacing': ['error', 'always'],
        'object-shorthand': 'error',
        'prefer-const': 2,
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'space-in-parens': ['error', 'never'],
        'strict': [2, 'never'],
        'no-console':'off',
        'no-useless-escape':'off'
    },
    'globals':{
    }
};
