# Synshape graph search architecture

## Match semantics

Graph search is local and case-insensitive. It indexes node labels, stable node identifiers, declared tensor shapes, node kind/source mode, operator type, operator endpoint labels, and initializer names. Results remain typed: **NODE**, **OP**, or **INIT**. No graph content is sent outside the browser.

## Focus behavior

Choosing a node or initializer result selects and rings the associated canvas node. Choosing an operator result selects its route, rings the route label, and opens the operator documentation card. The canvas render loop reads explicit highlighted IDs so search never needs to mutate the graph structure or block pointer input.

## Keyboard contract

The search field uses `ArrowDown` and `ArrowUp` to move the result cursor, `Enter` to focus the active result, and `Escape` to clear the search. The first result is preview-highlighted while a query is active. This gives large graphs immediate visual orientation without a separate search page.
