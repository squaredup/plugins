// Combines the issued invoices with the separate invoice_preview object (current month) into one row set
const toRow = (i, preview) => ({
    invoice_uuid: i.invoice_uuid || null,
    invoice_id: i.invoice_id || null,
    invoice_period: i.invoice_period || null,
    amount: i.amount === undefined || i.amount === null || i.amount === "" ? null : Number(i.amount),
    preview,
    updated_at: i.updated_at || null
});

result = (data.invoices || []).map((i) => toRow(i, false));
if (data.invoice_preview && !data.links?.pages?.prev) {
    // Only emit the preview once (first page), as it is repeated on every page
    result.unshift(toRow(data.invoice_preview, true));
}
