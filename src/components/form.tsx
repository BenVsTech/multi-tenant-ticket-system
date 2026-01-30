// Imports

import styles from "../app/page.module.css";
import { FormProps, element, FormDataTypes, ApiOptionData, Option } from "@/types/component";
import { useEffect, useState } from "react";
import ErrorPopup from "./errorPopup";

// Constants

const APIs_REQUIRING_ACCOUNT_ID = ['/api/roles', '/api/teams', '/api/users'];

// Exports

export default function Form({ setup, onClose, onSubmit }: FormProps) {

    const [apiOptions, setApiOptions] = useState<ApiOptionData[]>([]);
    const [formData, setFormData] = useState<FormDataTypes>({});
    const [optionsLoaded, setOptionsLoaded] = useState<boolean>(false);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {

        if(!setup.content.apiOptionsStatus) {
            setOptionsLoaded(true);
            return;
        }

        const getOptions = async function () {

            try{

                let options: ApiOptionData[] = [];

                for(const apiOption of setup.content.apiOptions) {
                    
                    let apiUrl = apiOption.api;

                    const requiresAccountId = setup.accountId !== null && setup.accountId !== undefined && APIs_REQUIRING_ACCOUNT_ID.some(api => 
                        apiOption.api === api || apiOption.api.startsWith(api + '/')
                    );
                    
                    if(requiresAccountId && setup.accountId !== null && setup.accountId !== undefined) {
                        const url = new URL(apiOption.api, window.location.origin);
                        url.searchParams.set('accountId', setup.accountId.toString());
                        apiUrl = url.toString();
                    }

                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if(!response.ok) {
                        setErrorMessage('Failed to fetch options');
                        setOptionsLoaded(true);
                        return;
                    }

                    const data = await response.json();

                    const returnData = {
                        reference: apiOption.ref,
                        options: data.data,
                    };

                    options.push(returnData);
                }

                setApiOptions(options);

            } catch(error: unknown) {
                setErrorMessage('Failed to fetch options');
            } finally {
                setOptionsLoaded(true);
            }

        }

        getOptions();

    }, [setup.content.apiOptionsStatus, setup.content.apiOptions, setup.accountId])

    useEffect(() => {

        const getData = async function () {

            if(!setup.api) {
                setDataLoaded(true);
                return;
            }

            try{

                let apiUrl = setup.api;
                
                const isTeamsApi = setup.api && setup.api.startsWith('/api/teams/') && setup.api !== '/api/teams';
                const isUsersApi = setup.api && setup.api.startsWith('/api/users/') && setup.api !== '/api/users';
                
                if(setup.accountId && (isTeamsApi || isUsersApi)) {
                    try {
                        const url = new URL(setup.api, window.location.origin);
                        url.searchParams.set('accountId', setup.accountId.toString());
                        apiUrl = url.toString();
                    } catch(urlError) {
                        const separator = setup.api.includes('?') ? '&' : '?';
                        apiUrl = `${setup.api}${separator}accountId=${setup.accountId}`;
                    }
                }

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
    
                if(!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                    }
                    setErrorMessage(errorData.message || 'Failed to get pre-filled data');
                    setDataLoaded(true);
                    return;
                }
    
                const data = await response.json();
    
                if(data.status && data.data) {
                    setFormData(data.data);
                } else {
                    setErrorMessage(data.message || 'Failed to get pre-filled data');
                }

            } catch(error: unknown) {
                console.error('Error fetching pre-filled data:', error);
                setErrorMessage(error instanceof Error ? error.message : 'Failed to get pre-filled data');
            } finally {
                setDataLoaded(true);
            }

        }

        getData();

    }, [setup.api, setup.accountId])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();
    
        const formData = new FormData(e.currentTarget);
        const values = Object.fromEntries(formData.entries());

        onSubmit(values as unknown as FormDataTypes);

    };

    if(!optionsLoaded || !dataLoaded) {
        return (
            <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["pd-all-round"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["background-style-primary"]}`}>
                Loading...
            </div>
        )
    }

    return (
        <>
            {errorMessage && (
                <ErrorPopup message={errorMessage} onClose={() => setErrorMessage(null)} />
            )}
            <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]}`}>
            <div className={`${styles["row-container"]} ${styles["width-100"]} ${styles["content-space-between"]} ${styles["align-start"]} ${styles["gap-20"]}`}>
                <div className={`${styles["column-container"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-5"]}`}>
                    <h1 className={`${styles["title-text"]}`}>{setup.content.title}</h1>
                    <p>{setup.content.description}</p>
                </div>
                <button 
                    className={`${styles["button-structure"]} ${styles["secondary-button"]} ${styles["clickable"]}`}
                    onClick={() => onClose()}
                >
                    Close
                </button>
            </div>
            <form onSubmit={handleSubmit} className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-20"]}`}>
                {
                    setup.content.elements.map((element: element) => (
                        <div key={element.id} className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-5"]}`}>
                            <label htmlFor={element.id}>
                                <b>{element.label}</b>
                            </label>
                            <p className={`${styles["faded"]}`}>{element.instructions}</p>

                            {
                                element.tag === 'input' && (
                                    <input 
                                        className={`${styles["input-structure"]} ${styles["width-100"]}`} 
                                        type={element.type} 
                                        id={element.id} 
                                        name={element.name} 
                                        placeholder={element.placeholder} 
                                        required={element.required}
                                        value={formData[element.name] as string || ''}
                                        onChange={(e) => setFormData({ ...formData, [element.name]: e.target.value })}
                                    />
                                )
                            }

                            {
                                element.tag === 'textarea' && (
                                    <textarea 
                                        className={`${styles["input-structure"]} ${styles["width-100"]}`} 
                                        id={element.id} 
                                        name={element.name} 
                                        placeholder={element.placeholder} 
                                        required={element.required}
                                        value={formData[element.name] as string || ''}
                                        onChange={(e) => setFormData({ ...formData, [element.name]: e.target.value })}
                                    />
                                )
                            }

                            {
                                element.tag === 'select' && (
                                    <select 
                                        className={`${styles["input-structure"]} ${styles["clickable"]} ${styles["width-100"]}`} 
                                        id={element.id} 
                                        name={element.name}
                                        required={element.required}
                                        value={formData[element.name] as string || ''}
                                        onChange={(e) => setFormData({ ...formData, [element.name]: e.target.value })}
                                    >

                                        <option value="">Select an option</option>

                                        {element.options.map((option: Option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}

                                        {apiOptions
                                            .find((apiOption) => apiOption.reference === element.optionApiRef)
                                            ?.options?.map((option, index) => {
                                                const apiOption = option as { id: number | string; name: string };
                                                const uniqueKey = `${element.optionApiRef}-${apiOption.id ?? index}`;
                                                return (
                                                    <option key={uniqueKey} value={apiOption.id}>{apiOption.name}</option>
                                                );
                                            })
                                        }

                                    </select>
                                )
                            }

                        </div>
                    ))
                }

                <div className={`${styles["row-container"]} ${styles["width-100"]} ${styles["content-end"]} ${styles["align-end"]} ${styles["gap-10"]}`}>
                    <button 
                        className={`${styles["button-structure"]} ${styles["primary-button"]} ${styles["clickable"]}`}
                        type="submit"
                    >
                        Submit
                    </button>
                </div>
            </form>
        </div>
        </>
    );
}