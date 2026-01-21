// Imports 

import { FormElements } from "@/types/component";

// Exports

export const newUserForm: FormElements = {
    title: 'Sign Up',
    description: 'Here you can create a new user account',
    apiOptionsStatus: false,
    apiOptions: [],
    elements: [
        {
            tag: 'input',
            type: 'text',
            label: 'Name',
            instructions: 'Enter your name',
            id: 'name',
            name: 'name',
            placeholder: 'Enter your name',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'input',
            type: 'email',
            label: 'Email',
            instructions: 'Enter your email',
            id: 'email',
            name: 'email',
            placeholder: 'Enter your email',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        }
    ]
}

