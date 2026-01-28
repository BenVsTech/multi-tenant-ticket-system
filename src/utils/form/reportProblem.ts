// Imports 

import { FormElements } from "@/types/component";

// Exports

export const reportProblemForm: FormElements = {
    title: 'Report a Problem',
    description: 'Here you can report a problem you are having with the system',
    apiOptionsStatus: false,
    apiOptions: [],
    elements: [
        {
            tag: 'select',
            type: 'select',
            label: 'Problem Type',
            instructions: 'Select the type of problem you are having',
            id: 'problem-type',
            name: 'problem-type',
            placeholder: 'Select the type of problem you are having',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: [
                { value: 'bug', label: 'Bug' },
                { value: 'feature', label: 'Feature' },
                { value: 'other', label: 'Other' },
            ]
        },
        {
            tag: 'textarea',
            type: 'textarea',
            label: 'Problem Description',
            instructions: 'Enter the description of the problem you are having',
            id: 'description',
            name: 'description',
            placeholder: 'Enter the description of the problem you are having',
            required: true,
            optionApiStatus: false,
            optionApiRef: null,
            options: []
        }
    ]
}

