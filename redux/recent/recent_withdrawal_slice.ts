import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RecentBeneficiary {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    bankUrl?: string;
    timestamp: number;
}

// Keyed by user email — each user has their own list
interface RecentWithdrawalState {
    recentBeneficiariesByUser: Record<string, RecentBeneficiary[]>;
}

const initialState: RecentWithdrawalState = {
    recentBeneficiariesByUser: {},
};

const recentWithdrawalSlice = createSlice({
    name: "recentWithdrawal",
    initialState,
    reducers: {
        addRecentWithdrawal: (
            state,
            action: PayloadAction<Omit<RecentBeneficiary, "timestamp"> & { userEmail: string }>
        ) => {
            const { userEmail, accountNumber, bankCode, ...rest } = action.payload;
            if (!userEmail) return;

            // Initialise list for this user if it doesn't exist
            if (!state.recentBeneficiariesByUser[userEmail]) {
                state.recentBeneficiariesByUser[userEmail] = [];
            }

            const list = state.recentBeneficiariesByUser[userEmail];

            // Remove duplicate to move it to the top
            const filtered = list.filter(
                (item) => !(item.accountNumber === accountNumber && item.bankCode === bankCode)
            );

            // Add to the top with current timestamp
            filtered.unshift({ accountNumber, bankCode, ...rest, timestamp: Date.now() });

            // Keep only the last 10
            state.recentBeneficiariesByUser[userEmail] = filtered.slice(0, 10);
        },

        clearRecentWithdrawals: (state, action: PayloadAction<string>) => {
            // Clear only the current user's list on logout
            const userEmail = action.payload;
            if (userEmail && state.recentBeneficiariesByUser[userEmail]) {
                delete state.recentBeneficiariesByUser[userEmail];
            }
        },
    },
});

export const { addRecentWithdrawal, clearRecentWithdrawals } = recentWithdrawalSlice.actions;
export default recentWithdrawalSlice.reducer;
