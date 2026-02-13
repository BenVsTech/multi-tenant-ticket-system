// Imports 

import { FormElements } from "@/types/component";

// Exports

export const ticketForm: FormElements = {
    title: 'Create New Ticket',
    description: 'Here you can create a new ticket. New tickets start as Unassigned and can be picked up by anyone in the selected team.',
    apiOptionsStatus: true,
    apiOptions: [
        {
            api: '/api/teams/options',
            ref: 'teams'
        }
    ],
    elements: [
        {
            tag: 'input',
            type: 'text',
            label: 'Ticket Title',
            instructions: 'Enter the title of the ticket',
            id: 'title',
            name: 'title',
            placeholder: 'e.g Ticket Title',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'textarea',
            type: 'textarea',
            label: 'Ticket Description',
            instructions: 'Enter the description of the ticket',
            id: 'description',
            name: 'description',
            placeholder: 'e.g This is the ticket description',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
        {
            tag: 'select',
            type: 'select',
            label: 'Assigned to Team',
            instructions: 'Select the team to assign the ticket to',
            id: 'assigned_to_team_id',
            name: 'assigned_to_team_id',
            placeholder: 'Select the team to assign the ticket to',
            required: true,
            optionApiStatus: true,
            optionApiRef: 'teams',
            options: []
        },
    ]
}

