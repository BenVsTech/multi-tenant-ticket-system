// Imports 

import { FormElements } from "@/types/component";

// Exports

export const ticketForm: FormElements = {
    title: 'Create New Ticket',
    description: 'Here you can create a new ticket',
    apiOptionsStatus: true,
    apiOptions: [
        {
            api: '/api/users/options',
            ref: 'users'
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
            tag: 'input',
            type: 'text',
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
            label: 'Ticket Status',
            instructions: 'Select the status of the ticket',
            id: 'status',
            name: 'status',
            placeholder: 'Select the status of the ticket',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: [
                { value: 'Backlog', label: 'backlog' },
                { value: 'On Hold', label: 'on hold' },
                { value: 'Blocked', label: 'blocked' },
                { value: 'In Progress', label: 'in progress' },
                { value: 'Completed', label: 'completed' },
            ]
        },
        {
            tag: 'select',
            type: 'select',
            label: 'Assigned to',
            instructions: 'Select the user to assign the ticket to',
            id: 'assigned_to_user_id',
            name: 'assigned_to_user_id',
            placeholder: 'Select the user to assign the ticket to',
            required: true,
            optionApiStatus: true,
            optionApiRef: 'users',
            options: []
        },
    ]
}

