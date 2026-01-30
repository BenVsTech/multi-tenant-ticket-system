// Imports 

import { FormElements } from "@/types/component";

// Exports

export const userForm: FormElements = {
    title: 'Create New User',
    description: 'Here you can create a new user',
    apiOptionsStatus: true,
    apiOptions: [
        {
            api: '/api/roles',
            ref: 'roles'
        },
        {
            api: '/api/teams',
            ref: 'teams'
        }
    ],
    elements: [
        {
            tag: 'input',
            type: 'text',
            label: 'User Name',
            instructions: 'Enter the name of the user',
            id: 'name',
            name: 'name',
            placeholder: 'e.g John Doe',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'input',
            type: 'text',
            label: 'User Email',
            instructions: 'Enter the email of the user',
            id: 'email',
            name: 'email',
            placeholder: 'e.g test@example.com',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'select',
            type: 'select',
            label: 'User Role',
            instructions: 'Select the role of the user',
            id: 'role_id',
            name: 'role_id',
            placeholder: 'Select the role of the user',
            required: true,
            optionApiStatus: true,
            optionApiRef: 'roles',
            options: []
        },
        {
            tag: 'select',
            type: 'select',
            label: 'User Team',
            instructions: 'Select the team of the user',
            id: 'team_id',
            name: 'team_id',
            placeholder: 'Select the team of the user',
            required: true,
            optionApiStatus: true,
            optionApiRef: 'teams',
            options: []
        }
    ]
}

