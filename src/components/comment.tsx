// Imports

import { useState } from "react";
import styles from "../app/page.module.css";
import { CommentProps, FormDataTypes } from "@/types/component";
import ErrorPopup from "./errorPopup";
import Form from "./form";
import { commentForm } from "@/utils/form/comment";

// Exports

export default function comment({ setup }: CommentProps) {

    const [searchTicketId, setSearchTicketId] = useState<string>("");
    const [comments, setComments] = useState<{id: number, comment: string, created_by: string, updated_at: string}[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [showAddCommentForm, setShowAddCommentForm] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [commentsLoaded, setCommentsLoaded] = useState<boolean>(false);

    const handleSearchTicketId = async () => {
        setLoading(true);
        try{

            const response = await fetch(`/api/comments?ticketId=${searchTicketId}&accountId=${setup.accountId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Failed to search for ticket id');
                setCommentsLoaded(false);
                return;
            }

            const result = await response.json();

            if(result.status && result.data) {
                setComments(result.data);
                setCommentsLoaded(true);
                setErrorMessage("");
            } else {
                setErrorMessage(result.message || 'Failed to search for ticket id');
                setCommentsLoaded(false);
            }

        } catch(error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to search for ticket id');
            setCommentsLoaded(false);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateComment = async (data: FormDataTypes) => {
        setLoading(true);
        try{

            const response = await fetch(`/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: data.text,
                    ticketId: searchTicketId,
                    accountId: setup.accountId,
                }),
            });

            if(!response.ok) {
                const errorData = await response.json();
                setErrorMessage(errorData.message || 'Failed to create comment');
                return;
            }

            const result = await response.json();

            if(result.status && result.data) {
                setErrorMessage("");
                await handleSearchTicketId();
            } else {
                setErrorMessage(result.message || 'Failed to create comment');
            }

        } catch(error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to create comment');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {errorMessage && (
                <ErrorPopup message={errorMessage} onClose={() => setErrorMessage("")} />
            )}
            <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]}`}>
                <h1 className={`${styles["title-text"]} ${styles["text-left"]}`}>Comments</h1>
                <p className={`${styles["text-left"]}`}>Here you can view the comments and their details</p>
                <div className={`${styles["row-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]}`}>
                    <input type="text" placeholder="search ticket id" className={`${styles["input-structure"]} ${styles["width-100"]}`} disabled={loading} value={searchTicketId} onChange={(e) => setSearchTicketId(e.target.value)} />
                    <button className={`${styles["button-structure"]} ${styles["primary-button"]} ${loading ? styles["un-clickable"] : styles["clickable"]}`} disabled={loading} onClick={handleSearchTicketId}>Search</button>
                </div>

                {commentsLoaded && comments.length > 0 && (
                    <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-start"]} ${styles["gap-10"]}`}>
                        {comments.map((comment) => (
                            <div key={comment.id} className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-space-between"]} ${styles["align-start"]} ${styles["gap-10"]} ${styles["primary-background"]} ${styles["rounded"]} ${styles["pd-all-round"]}`}>
                                <p>{comment.comment}</p>
                                <p>
                                    <b>
                                        {comment.created_by} - {new Date(comment.updated_at).toLocaleString()}
                                    </b>
                                </p>
                            </div>
                        ))}

                        <div className={`${styles["row-container"]} ${styles["width-100"]} ${styles["content-center"]} ${styles["align-center"]} ${styles["gap-10"]}`}>
                            <button className={`${styles["button-structure"]} ${styles["primary-button"]} ${styles["clickable"]}`} onClick={() => setShowAddCommentForm(true)}>Add Comment</button>
                        </div>

                        {showAddCommentForm && (
                            <Form 
                                setup={{
                                    api: null,
                                    content: commentForm,
                                    accountId: setup.accountId
                                }} 
                                onClose={() => setShowAddCommentForm(false)} 
                                onSubmit={(data) => {
                                    handleCreateComment(data);
                                    setShowAddCommentForm(false);
                                }} 
                            />
                        )}
                    </div>
                )}
                {commentsLoaded && comments.length === 0 && (
                    <div className={`${styles["column-container"]} ${styles["width-100"]} ${styles["content-start"]} ${styles["align-center"]} ${styles["gap-10"]}`}>
                        <p>No comments on this ticket</p>
                        <button className={`${styles["button-structure"]} ${styles["primary-button"]} ${styles["clickable"]}`} onClick={() => setShowAddCommentForm(true)}>Add Comment</button>
                        {showAddCommentForm && (
                            <Form 
                                setup={{
                                    api: null,
                                    content: commentForm,
                                    accountId: setup.accountId
                                }} 
                                onClose={() => setShowAddCommentForm(false)} 
                                onSubmit={(data) => {
                                    handleCreateComment(data);
                                    setShowAddCommentForm(false);
                                }} 
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
