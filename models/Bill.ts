import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }, // Reference to the Client
    payable: { type: Boolean, required: true }, // Indicates if the bill is payable
    consumeInLiters: { type: Number, required: true }, // Consumption in liters
    amountToPay: { type: Number, required: true }, // Amount to be paid
    date: { type: Date, required: true }, // Date of the bill
    billResume: { type: [String], required: false }, // Array to store bill summary (optional)
  },
  { timestamps: true }
); // Includes createdAt and updatedAt timestamps

export default mongoose.models.Bill || mongoose.model('Bill', BillSchema);
