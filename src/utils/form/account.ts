// Imports 

import { FormElements } from "@/types/component";

// Exports

export const accountForm: FormElements = {
    title: 'Create New Account',
    description: 'Here you can create a new account',
    apiOptionsStatus: false,
    apiOptions: [],
    elements: [
        {
            tag: 'input',
            type: 'text',
            label: 'Account Name',
            instructions: 'Enter the name of the account',
            id: 'name',
            name: 'name',
            placeholder: 'Enter the name of the account',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'textarea',
            type: 'textarea',
            label: 'Account Description',
            instructions: 'Enter the description of the account',
            id: 'description',
            name: 'description',
            placeholder: 'Enter the description of the account',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        }
    ]
}

