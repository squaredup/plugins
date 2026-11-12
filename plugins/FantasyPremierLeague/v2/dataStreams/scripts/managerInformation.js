var manager = Object.assign({}, data);
// Drop variable-length branches (league count, gameweeks entered and cup
// progress differ per manager) so expandInnerObjects can't flatten them
// into an unbounded, manager-dependent set of columns.
delete manager.leagues;
delete manager.entered_events;
delete manager.kit;
result = [manager];
