# ADR: Use Supplier-Based Material Pricing

## Status
Accepted

## Context
Anodizex quotation costs depend on supplier offers for aluminium profiles, glass, hardware, accessories, and other inputs. A single material-level cost is useful as a default, but it does not show which supplier price was used or how that supplier price changed over time.

## Decision
Store supplier-specific material prices as workspace-scoped records under each quotation material. Each supplier price keeps supplier name, SKU, unit cost, currency, lead time, preferred state, archived state, and its own price history. Project quotation material lines can select a supplier price and snapshot supplier name/SKU/unit cost at quote save time.

## Consequences
- Admin users can compare supplier prices per material and mark a preferred supplier price as the material default.
- Pricing history is auditable per supplier offer, not only per material.
- Saved quotations remain stable when supplier prices change later.
- Supplier contact management and purchase orders remain future work.

## Alternatives Considered
- Keep one supplier text field on `QuotationMaterial`: rejected because it cannot represent multiple supplier offers or supplier-specific pricing history.
- Add a full supplier/company CRM model now: deferred because quotation pricing only needs supplier offers first.

## Date
2026-07-02
