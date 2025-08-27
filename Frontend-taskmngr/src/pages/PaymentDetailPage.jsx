import React from "react";
import { useParams } from "react-router-dom";

const PaymentDetailPage = () => {
    const { paymentId } = useParams();

    return (
        <div className="payment-detail-page">
            <h1>Payment Detail</h1>
            <p>Payment ID: {paymentId}</p>
            {/* TODO: Fetch and display payment details here */}
        </div>
    );
};

export default PaymentDetailPage;