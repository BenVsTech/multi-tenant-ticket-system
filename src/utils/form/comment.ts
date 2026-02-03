// Imports 

import { FormElements } from "@/types/component";

// Exports

export const commentForm: FormElements = {
    title: 'Add New Comment',
    description: 'Here you can add a new comment',
    apiOptionsStatus: false,
    apiOptions: [],
    elements: [
        {
            tag: 'input',
            type: 'text',
            label: 'Comment',
            instructions: 'Enter your comment',
            id: 'text',
            name: 'text',
            placeholder: 'Enter your comment',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        },
    ]
}

