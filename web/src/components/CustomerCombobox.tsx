'use client';

import { useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import customersData from '@/data/customers.json';

interface CustomerOption {
    value: string;
    label: string;
    kana: string;
}

interface CustomerComboboxProps {
    value: string;
    onChange: (value: string) => void;
}

export default function CustomerCombobox({ value, onChange }: CustomerComboboxProps) {
    // 1. Prepare Options with Memoization
    const options: CustomerOption[] = useMemo(() => {
        return customersData.map(c => ({
            value: c.name,
            label: c.name, // Display Name
            kana: c.kana   // Hidden field for search
        }));
    }, []);

    // 2. Custom Filter Logic (Name OR Kana)
    // 2. Custom Filter Logic (Name OR Kana)
    const filterOption = (option: { data: any }, inputValue: string) => {
        const input = inputValue.toLowerCase();
        const label = option.data.label || '';
        const kana = option.data.kana || '';

        const nameMatch = label.toLowerCase().includes(input);
        const kanaMatch = kana.includes(input);
        return nameMatch || kanaMatch;
    };

    // 3. Handle Change
    const handleChange = (newValue: any) => {
        // newValue is { value, label, ... } or null
        onChange(newValue ? newValue.value : '');
    };

    // 4. Find current value object for the Select component
    const currentValue = options.find(opt => opt.value === value) || (value ? { value, label: value, kana: '' } : null);

    return (
        <CreatableSelect
            instanceId="customer-search" // Fix for SSR hydration mismatch
            options={options}
            value={currentValue}
            onChange={handleChange}
            filterOption={filterOption}
            isClearable
            placeholder="配送先を検索 (例: 'io' -> イオン)..."
            formatCreateLabel={(inputValue) => `"${inputValue}" を新しい配送先として使用`}
            styles={{
                control: (base) => ({
                    ...base,
                    borderColor: 'black',
                    borderRadius: 0,
                    minHeight: '38px'
                }),
                menu: (base) => ({
                    ...base,
                    zIndex: 9999 // Ensure it pops over everything
                })
            }}
        />
    );
}
