// Imports 

import { FormElements } from "@/types/component";

// Exports

export const teamForm: FormElements = {
    title: 'Create New Team',
    description: 'Here you can create a new team',
    apiOptionsStatus: true,
    apiOptions: [],
    elements: [
        {
            tag: 'input',
            type: 'text',
            label: 'Team Name',
            instructions: 'Enter the name of the team',
            id: 'name',
            name: 'name',
            placeholder: 'e.g Administration Team',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'input',
            type: 'text',
            label: 'Team Description',
            instructions: 'Enter the description of the team',
            id: 'description',
            name: 'description',
            placeholder: 'e.g This is the administration team for the account',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
    ]
}

