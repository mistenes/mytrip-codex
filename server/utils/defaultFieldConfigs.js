export function getDefaultFieldConfigs() {
    return [
        { field: 'firstName', label: 'Keresztnév', type: 'text', locked: true, enabled: true, order: 1, section: 'passport' },
        { field: 'lastName', label: 'Vezetéknév', type: 'text', locked: true, enabled: true, order: 2, section: 'passport' },
        { field: 'middleName', label: 'Második keresztnév', type: 'text', enabled: true, order: 3, section: 'passport' },
        { field: 'dateOfBirth', label: 'Születési dátum', type: 'date', locked: true, enabled: true, order: 4, section: 'passport' },
        { field: 'passportNumber', label: 'Útlevélszám', type: 'text', enabled: true, order: 5, section: 'passport' },
        { field: 'issueDate', label: 'Kiadás dátuma', type: 'date', enabled: false, order: 6, section: 'passport' },
        { field: 'issuingCountry', label: 'Kibocsátó ország', type: 'text', enabled: true, order: 7, section: 'passport' },
        { field: 'expiryDate', label: 'Lejárati dátum', type: 'date', enabled: true, order: 8, section: 'passport' },
        { field: 'nationality', label: 'Állampolgárság', type: 'text', enabled: true, order: 9, section: 'passport' },
        { field: 'sex', label: 'Nem', type: 'text', enabled: true, order: 10, section: 'passport' },
    ];
}
