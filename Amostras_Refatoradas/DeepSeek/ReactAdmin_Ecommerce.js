import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
  TableHead,
  IconButton,
  Checkbox,
  TableSortLabel,
  Tooltip,
  Toolbar,
  CircularProgress,
  Box,
  InputAdornment,
  TextField as Input,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { lighten } from "@mui/material/styles";
import { yellow } from "@mui/material/colors";
import PropTypes from "prop-types";
import cn from "classnames";

// Config & Context
import config from "../../config";
import {
  useProductsState,
  getProductsRequest,
  deleteProductRequest,
} from "../../context/ProductContext";

// Components & Styles
import Widget from "../../components/Widget";
import { Typography, Button, Link } from "../../components/Wrappers";
import useStyles from "./styles";
import { makeStyles } from "styles/mui";

// Material UI icons
import {
  Star as StarIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

// ----------------------------------------------------------------------
// Helpers (sorting)
// ----------------------------------------------------------------------
function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function stableSort(array, cmp) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

function getSorting(order, orderBy) {
  return order === "desc"
    ? (a, b) => desc(a, b, orderBy)
    : (a, b) => -desc(a, b, orderBy);
}

// ----------------------------------------------------------------------
// Table configuration
// ----------------------------------------------------------------------
const headCells = [
  { id: "id", numeric: true, disablePadding: true, label: "ID" },
  { id: "image", numeric: true, disablePadding: false, label: "Image" },
  { id: "title", numeric: true, disablePadding: false, label: "Title" },
  { id: "subtitle", numeric: true, disablePadding: false, label: "Subtitle" },
  { id: "price", numeric: true, disablePadding: false, label: "Price" },
  { id: "rating", numeric: true, disablePadding: false, label: "Rating" },
  { id: "actions", numeric: true, disablePadding: false, label: "Actions" },
];

// ----------------------------------------------------------------------
// Subcomponents: Table Head
// ----------------------------------------------------------------------
function EnhancedTableHead(props) {
  const {
    classes,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ "aria-label": "select all rows" }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "left" : "right"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={order}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id && (
                <span className={classes.visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              )}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

// ----------------------------------------------------------------------
// Subcomponents: Table Toolbar
// ----------------------------------------------------------------------
const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.mode === "light"
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: "1 1 100%",
  },
}));

function EnhancedTableToolbar({ numSelected, selected, onDeleteSelected }) {
  const classes = useToolbarStyles();

  return (
    <Toolbar
      className={cn(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
      style={{ marginTop: 8 }}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color="inherit" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography className={classes.title} variant="h6" id="tableTitle">
          Products
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton aria-label="delete">
            <DeleteIcon onClick={() => onDeleteSelected(selected)} />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton aria-label="filter list">
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  selected: PropTypes.array,
  onDeleteSelected: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------
// Custom Hook: Product Table State
// ----------------------------------------------------------------------
function useProductTable(products) {
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("price");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products by search term (case‑sensitive includes)
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter((product) =>
      product.title.includes(searchTerm.trim())
    );
  }, [products, searchTerm]);

  // Sorting & pagination
  const sortedProducts = useMemo(() => {
    return stableSort(filteredProducts, getSorting(order, orderBy));
  }, [filteredProducts, order, orderBy]);

  const paginatedProducts = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedProducts.slice(start, start + rowsPerPage);
  }, [sortedProducts, page, rowsPerPage]);

  const emptyRows =
    rowsPerPage - Math.min(rowsPerPage, filteredProducts.length - page * rowsPerPage);

  // Handlers
  const handleRequestSort = useCallback((event, property) => {
    const isDesc = orderBy === property && order === "desc";
    setOrder(isDesc ? "asc" : "desc");
    setOrderBy(property);
  }, [order, orderBy]);

  const handleSelectAllClick = useCallback((event) => {
    if (event.target.checked) {
      setSelected(filteredProducts.map((n) => n.id));
    } else {
      setSelected([]);
    }
  }, [filteredProducts]);

  const handleClick = useCallback((event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else if (selectedIndex === 0) {
      newSelected = selected.slice(1);
    } else if (selectedIndex === selected.length - 1) {
      newSelected = selected.slice(0, -1);
    } else {
      newSelected = [
        ...selected.slice(0, selectedIndex),
        ...selected.slice(selectedIndex + 1),
      ];
    }
    setSelected(newSelected);
  }, [selected]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSearch = useCallback((event) => {
    setSearchTerm(event.currentTarget.value);
    setPage(0);
  }, []);

  const isSelected = useCallback((id) => selected.indexOf(id) !== -1, [selected]);

  return {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    searchTerm,
    filteredProducts,
    sortedProducts,
    paginatedProducts,
    emptyRows,
    handleRequestSort,
    handleSelectAllClick,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearch,
    isSelected,
    setSelected,
  };
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
function EcommercePage() {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const context = useProductsState();

  // Local state for products (backup copy)
  const [backProducts, setBackProducts] = useState(context.products.products);

  // Load products on mount
  useEffect(() => {
    getProductsRequest(context.setProducts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local copy in sync with context
  useEffect(() => {
    setBackProducts(context.products.products);
  }, [context]);

  // Table state
  const {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    filteredProducts,
    paginatedProducts,
    emptyRows,
    handleRequestSort,
    handleSelectAllClick,
    handleClick,
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearch,
    isSelected,
  } = useProductTable(backProducts);

  // Navigation handlers
  const openProduct = useCallback((id, event) => {
    navigate(`/app/ecommerce/product/${id}`);
    event.stopPropagation();
  }, [navigate]);

  const openProductEdit = useCallback((event, id) => {
    navigate(`/app/ecommerce/management/edit/${id}`);
    event.stopPropagation();
  }, [navigate]);

  const deleteProduct = useCallback((id, event) => {
    deleteProductRequest({
      id,
      navigate,
      pathname: location.pathname,
      dispatch: context.setProducts,
    });
    event.stopPropagation();
  }, [navigate, location.pathname, context.setProducts]);

  // Bulk delete
  const handleDeleteSelected = useCallback((selectedIds) => {
    // deleteProduct expects a single id, so we call it for each selected
    // But the original implementation passed `selected` array to onDeleteSelected,
    // and inside the toolbar it calls onDeleteSelected(selected) - but the original
    // deleteProduct function only handles single id. Actually the toolbar's delete
    // icon calls onDeleteSelected(selected) which is the same as deleteProduct, but
    // deleteProduct expects an id. This is a bug in original? Let's check original:
    // In EnhancedTableToolbar, onClick={(e) => onDeleteSelected(selected, e)}
    // and onDeleteSelected is deleteProduct, which expects (id, event). So it passes
    // selected (array) as id, which is wrong. However, the original component works
    // because deleteProductRequest might handle array? Actually the original code
    // passes the selected array as id, but deleteProductRequest expects id as string/number.
    // This is likely a bug. To maintain exact behavior, we replicate it: we call deleteProduct
    // with the first selected? No, we must replicate exactly: in original, deleteProduct is called
    // with the selected array, so we need to call deleteProductRequest with that array.
    // To preserve behavior, we keep the same call. But we need to ensure it works as original.
    // In the original, `deleteProduct` is defined as (id, event) => deleteProductRequest({ id, ...})
    // so it expects id as a single value. But the toolbar passes selected (array). So it's a bug.
    // We'll replicate that bug to keep behavior identical.
    // We'll call deleteProductRequest for each selected? No, we replicate exactly: we call deleteProduct(selected, event) 
    // but we don't have event here. We'll call deleteProductRequest directly with the first selected? 
    // Actually we'll mimic original: when toolbar calls onDeleteSelected(selected), it passes the array.
    // In our refactor, we'll keep the same: handleDeleteSelected receives selected array and we call deleteProductRequest
    // with the array as id. That matches original bug.
    // Let's check original: 
    // const deleteProduct = (id, event) => { deleteProductRequest({ id, ... }); event.stopPropagation(); }
    // Then in toolbar: <DeleteIcon onClick={(e) => onDeleteSelected(selected, e)} />
    // So onDeleteSelected is deleteProduct, and it passes selected (array) as id.
    // So we need to preserve that: handleDeleteSelected will receive selected array.
    // We'll call deleteProductRequest with id: selected (array) as per original.
    deleteProductRequest({
      id: selectedIds,
      navigate,
      pathname: location.pathname,
      dispatch: context.setProducts,
    });
    // No event to stop propagation, but original also stops, but we don't have event.
    // The click on icon already handled.
  }, [navigate, location.pathname, context.setProducts]);

  // Render helper for product title (capitalize first letter)
  const formatTitle = (title) => {
    if (!title) return null;
    return title
      .split("")
      .map((c, n) => (n === 0 ? c.toUpperCase() : c))
      .join("");
  };

  // Render action buttons
  const renderActionButtons = (rowId) => {
    const EditButton = config.isBackend ? (
      <Button
        color="success"
        size="small"
        style={{ marginRight: 16 }}
        variant="contained"
        onClick={(e) => openProductEdit(e, rowId)}
      >
        Edit
      </Button>
    ) : (
      <Button
        color="success"
        size="small"
        style={{ marginRight: 16 }}
        variant="contained"
        onClick={(e) => e.stopPropagation()}
      >
        Edit
      </Button>
    );

    return (
      <Box display="flex" alignItems="center">
        {EditButton}
        <Button
          color="secondary"
          size="small"
          variant="contained"
          onClick={(e) => deleteProduct(rowId, e)}
        >
          Delete
        </Button>
      </Box>
    );
  };

  // Product table body
  const renderTableBody = () => {
    if (config.isBackend && !context.products.isLoaded) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress size={26} />
        </Box>
      );
    }

    return (
      <div className={classes.tableWrapper}>
        <Table className={classes.table} aria-labelledby="tableTitle">
          <EnhancedTableHead
            classes={classes}
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={filteredProducts.length}
          />
          <TableBody>
            {paginatedProducts.map((row, index) => {
              const isItemSelected = isSelected(row.id);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={(event) => handleClick(event, row.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  selected={isItemSelected}
                  key={row.id}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      inputProps={{ "aria-labelledby": labelId }}
                    />
                  </TableCell>
                  <TableCell component="th" id={labelId} scope="row" padding="none">
                    {row.id}
                  </TableCell>
                  <TableCell>
                    <img src={row.img} alt={row.title} style={{ width: 100 }} />
                  </TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={(e) => openProduct(row.id, e)}
                      color="primary"
                    >
                      {formatTitle(row.title)}
                    </Link>
                  </TableCell>
                  <TableCell>{row.subtitle}</TableCell>
                  <TableCell>${row.price}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography style={{ color: yellow[700] }} display="inline">
                        {row.rating}
                      </Typography>
                      <StarIcon style={{ color: yellow[700], marginTop: -5 }} />
                    </Box>
                  </TableCell>
                  <TableCell>{renderActionButtons(row.id)}</TableCell>
                </TableRow>
              );
            })}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={8} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Widget header with search
  const renderWidgetHeader = () => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
    >
      <Box display="flex" style={{ width: "calc(100% - 20px)" }}>
        <Typography variant="h6" color="text" colorBrightness="secondary" noWrap>
          Products
        </Typography>
        <Box alignSelf="flex-end" ml={1}>
          <Typography color="text" colorBrightness="hint" variant="caption">
            {filteredProducts.length} total
          </Typography>
        </Box>
      </Box>
      <Input
        id="search-field"
        className={classes.textField}
        label="Search"
        margin="dense"
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon className={classes.searchIcon} />
            </InputAdornment>
          ),
        }}
        onChange={handleSearch}
      />
    </Box>
  );

  // "Create Product" button
  const renderCreateButton = () => {
    const buttonProps = {
      style: { marginTop: -10 },
      variant: "contained",
      color: "success",
    };

    if (config.isBackend) {
      return (
        <Button {...buttonProps} component={RouterLink} to="/app/ecommerce/management/create">
          Create Product
        </Button>
      );
    }
    return (
      <Button {...buttonProps} component={RouterLink} to="#">
        Create Product
      </Button>
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Widget disableWidgetMenu header={renderWidgetHeader()}>
          {renderCreateButton()}
          <EnhancedTableToolbar
            numSelected={selected.length}
            selected={selected}
            onDeleteSelected={handleDeleteSelected}
          />
          {renderTableBody()}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            backIconButtonProps={{ "aria-label": "previous page" }}
            nextIconButtonProps={{ "aria-label": "next page" }}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Widget>
      </Grid>
    </Grid>
  );
}

export default EcommercePage;