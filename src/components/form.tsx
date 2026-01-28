// Imports

import styles from "../app/page.module.css";
import { FormProps, element, FormDataTypes } from "@/types/component";
import { useEffect, useState } from "react";
import ErrorPopup from "./errorPopup";

// Exports

export default function Form({ setup, onClose, onSubmit }: FormProps) {

    const [apiOptions, setApiOptions] = useState<any[]>([]);
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

                let options: any[] = [];

                for(const apiOption of setup.content.apiOptions) {
                    
                    let apiUrl = apiOption.api;
                    if(setup.accountId && (apiOption.api === '/api/roles' || apiOption.api.includes('/api/roles'))) {
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

    }, [setup.content.apiOptionsStatus, setup.content.apiOptions])

    useEffect(() => {

        const getData = async function () {

            if(!setup.api) {
                setDataLoaded(true);
                return;
            }

            try{

                const response = await fetch(setup.api, {
                    method: 'GET',
                });
    
                if(!response.ok) {
                    setErrorMessage('Failed to fetch ticket');
                    setDataLoaded(true);
                    return;
                }
    
                const data = await response.json();
    
                if(data.status) {
                    setFormData(data.data);
                } else {
                    setErrorMessage(data.message || 'Failed to fetch ticket');
                }

            } catch(error: unknown) {
                setErrorMessage('Failed to fetch ticket');
            } finally {
                setDataLoaded(true);
            }

        }

        getData();

    }, [setup.api])

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

                                        {element.options.map((option: any) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}

                                        {apiOptions
                                            .find((apiOption) => apiOption.reference === element.optionApiRef)
                                            ?.options?.map((option: any) => (
                                                <option key={option.id} value={option.id}>{option.name}</option>
                                            ))
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