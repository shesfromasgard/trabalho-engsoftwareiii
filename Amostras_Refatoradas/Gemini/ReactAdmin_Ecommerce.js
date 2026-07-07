import React, { useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import cn from "classnames";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
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
import {
  Star as StarIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { yellow } from "@mui/material/colors";
import { lighten } from "@mui/material/styles";
import { makeStyles } from "styles/mui";

import config from "../../config";
import useStyles from "./styles";
import Widget from "../../components/Widget";
import { Typography, Button, Link } from "../../components/Wrappers";
import {
  useProductsState,
  getProductsRequest,
  deleteProductRequest,
} from "../../context/ProductContext";

// --- Helper Functions for Sorting ---
function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function getSorting(order, orderBy) {
  return order === "desc"
    ? (a, b) => desc(a, b, orderBy)
    : (a, b) => -desc(a, b, orderBy);
}

const capitalizeFirstLetter = (string) => {
  if (!string) return null;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// --- Table Configuration ---
const headCells = [
  { id: "id", numeric: true, disablePadding: true, label: "ID" },
  { id: "image", numeric: true, disablePadding: false, label: "Image" },
  { id: "title", numeric: true, disablePadding: false, label: "Title" },
  { id: "subtitle", numeric: true, disablePadding: false, label: "Subtitle" },
  { id: "price", numeric: true, disablePadding: false, label: "Price" },
  { id: "rating", numeric: true, disablePadding: false, label: "Rating" },
  { id: "actions", numeric: true, disablePadding: false, label: "Actions" },
];

// --- Component: EnhancedTableHead ---
function EnhancedTableHead({
  classes,
  onSelectAllClick,
  order,
  orderBy,
  numSelected,
  rowCount,
  onRequestSort,
}) {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
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
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
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

// --- Component: EnhancedTableToolbar ---
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

const EnhancedTableToolbar = ({ numSelected, selected, onDeleteSelected }) => {
  const classes = useToolbarStyles();
  const isSelectionEmpty = numSelected === 0;

  return (
    <Toolbar
      className={cn(classes.root, { [classes.highlight]: !isSelectionEmpty })}
      style={{ marginTop: 8 }}
    >
      <Typography
        className={classes.title}
        variant={isSelectionEmpty ? "h6" : "subtitle1"}
        color={isSelectionEmpty ? "textPrimary" : "inherit"}
        id={isSelectionEmpty ? "tableTitle" : undefined}
      >
        {isSelectionEmpty ? "Products" : `${numSelected} selected`}
      </Typography>

      {!isSelectionEmpty ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="delete"
            onClick={(e) => onDeleteSelected(selected, e)}
          >
            <DeleteIcon />
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
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  selected: PropTypes.array.isRequired,
  onDeleteSelected: PropTypes.func.isRequired,
};

// --- Main Component: EcommercePage ---
function EcommercePage() {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const context = useProductsState();

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("price");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [backProducts, setBackProducts] = useState(
    context?.products?.products || []
  );

  useEffect(() => {
    getProductsRequest(context.setProducts);
  }, []);

  useEffect(() => {
    setBackProducts(context?.products?.products || []);
  }, [context]);

  const handleRequestSort = useCallback((event, property) => {
    const isDesc = orderBy === property && order === "desc";
    setOrder(isDesc ? "asc" : "desc");
    setOrderBy(property);
  }, [order, orderBy]);

  const searchProducts = useCallback((e) => {
    const searchValue = e.currentTarget.value;
    const allProducts = context?.products?.products || [];
    const filteredProducts = allProducts.filter((product) =>
      product.title.includes(searchValue)
    );
    setBackProducts(filteredProducts);
  }, [context]);

  const openProduct = useCallback((id, event) => {
    event.stopPropagation();
    navigate(`/app/ecommerce/product/${id}`);
  }, [navigate]);

  const handleSelectAllClick = useCallback((event) => {
    if (event.target.checked) {
      const newSelecteds = backProducts.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, [backProducts]);

  const handleClick = useCallback((event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else if (selectedIndex === 0) {
      newSelected = selected.slice(1);
    } else if (selectedIndex === selected.length - 1) {
      newSelected = selected.slice(0, -1);
    } else if (selectedIndex > 0) {
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

  const deleteProduct = useCallback((id, event) => {
    event.stopPropagation();
    deleteProductRequest({
      id,
      navigate,
      pathname: location.pathname,
      dispatch: context.setProducts,
    });
  }, [navigate, location.pathname, context.setProducts]);

  const openProductEdit = useCallback((event, id) => {
    event.stopPropagation();
    navigate(`/app/ecommerce/management/edit/${id}`);
  }, [navigate]);

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows = useMemo(() => {
    return rowsPerPage - Math.min(rowsPerPage, backProducts.length - page * rowsPerPage);
  }, [rowsPerPage, backProducts.length, page]);

  const sortedAndPaginatedProducts = useMemo(() => {
    return stableSort(backProducts, getSorting(order, orderBy)).slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [backProducts, order, orderBy, page, rowsPerPage]);

  const renderActionButtons = (row) => {
    if (config.isBackend) {
      return (
        <Button
          color="success"
          size="small"
          style={{ marginRight: 16 }}
          variant="contained"
          onClick={(e) => openProductEdit(e, row.id)}
        >
          Edit
        </Button>
      );
    }
    return (
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
  };

  const widgetHeader = (
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
            {backProducts.length} total
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
        onChange={searchProducts}
      />
    </Box>
  );

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Widget disableWidgetMenu header={widgetHeader}>
          <Button
            style={{ marginTop: -10 }}
            variant="contained"
            component={RouterLink}
            to={config.isBackend ? "/app/ecommerce/management/create" : "#"}
            color="success"
          >
            Create Product
          </Button>

          <EnhancedTableToolbar
            numSelected={selected.length}
            selected={selected}
            onDeleteSelected={deleteProduct}
          />

          {config.isBackend && !context.products.isLoaded ? (
            <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress size={26} />
            </Box>
          ) : (
            <div className={classes.tableWrapper}>
              <Table
                className={classes.table}
                aria-labelledby="tableTitle"
                aria-label="enhanced table"
              >
                <EnhancedTableHead
                  classes={classes}
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={backProducts.length}
                />
                <TableBody>
                  {sortedAndPaginatedProducts.map((row, index) => {
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
                          <img
                            src={row.img}
                            alt={row.title}
                            style={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => openProduct(row.id, e)}
                            color="primary"
                          >
                            {capitalizeFirstLetter(row.title)}
                          </Link>
                        </TableCell>
                        <TableCell>{row.subtitle}</TableCell>
                        <TableCell>${row.price}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Typography style={{ color: yellow[700] }} display="inline">
                              {row.rating}
                            </Typography>{" "}
                            <StarIcon
                              style={{
                                color: yellow[700],
                                marginTop: -5,
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {renderActionButtons(row)}
                            <Button
                              color="secondary"
                              size="small"
                              variant="contained"
                              onClick={(e) => deleteProduct(row.id, e)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
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
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={backProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            backIconButtonProps={{
              "aria-label": "previous page",
            }}
            nextIconButtonProps={{
              "aria-label": "next page",
            }}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Widget>
      </Grid>
    </Grid>
  );
}

// eslint-disable-next-line no-unused-vars
function CloseButton({ closeToast, className }) {
  return <CloseIcon className={className} onClick={closeToast} />;
}

CloseButton.propTypes = {
  closeToast: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default EcommercePage;