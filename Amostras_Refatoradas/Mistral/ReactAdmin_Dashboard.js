import React, { useState, useMemo } from "react";
import {
  Grid,
  LinearProgress,
  Select,
  OutlinedInput,
  MenuItem,
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  TablePagination,
  TableHead,
  TableSortLabel,
  Toolbar,
  IconButton,
  Menu,
  Tooltip,
} from "@mui/material";
import { useTheme } from "styles/mui";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Line,
  Area,
  PieChart,
  Pie,
  Cell,
  YAxis,
  XAxis,
} from "recharts";

import useStyles from "./styles";
import Widget from "../../components/Widget";
import { Chip, Typography, Avatar } from "../../components/Wrappers";
import Dot from "../../components/Sidebar/components/Dot";
import BigStat from "./components/BigStat/BigStat";
import {
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreIcon,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import { lighten } from "@mui/material/styles";
import cn from "classnames";

// Constants
const PIE_CHART_DATA = [
  { name: "Group A", value: 400, color: "primary" },
  { name: "Group B", value: 300, color: "secondary" },
  { name: "Group C", value: 300, color: "warning" },
  { name: "Group D", value: 200, color: "success" },
];

const TICKET_CHART_DATA = Array(20)
  .fill()
  .map((_, index) => ({
    name: `Client ${index + 1}`,
    value: 2,
    color: "primary",
  }));

const HEAD_CELLS = [
  {
    id: "id",
    numeric: true,
    disablePadding: true,
    label: "Order ID",
  },
  { id: "customer", numeric: true, disablePadding: false, label: "Customer" },
  { id: "office", numeric: true, disablePadding: false, label: "Office" },
  { id: "weight", numeric: true, disablePadding: false, label: "Netto Weight" },
  { id: "price", numeric: true, disablePadding: false, label: "Price" },
  {
    id: "purchase-date",
    numeric: true,
    disablePadding: false,
    label: "Date of purchase",
  },
  {
    id: "delivery-date",
    numeric: true,
    disablePadding: false,
    label: "Date of Delivery",
  },
  { id: "status", numeric: true, disablePadding: false, label: "Status" },
  { id: "actions", numeric: true, disablePadding: false, label: "Actions" },
];

const INITIAL_ROWS = [
  {
    id: 1,
    orderId: Math.floor(Math.random() * 3000000),
    customer: "Victoria Cantrel",
    office: "Croatia",
    weight: "1.4 kg",
    price: 23.87,
    purDate: "12 Jan 2019",
    delDate: "-",
    status: "Pending",
    color: "primary",
  },
  {
    id: 2,
    orderId: Math.floor(Math.random() * 3000000),
    customer: "Cherokee Ware",
    office: "Belgium",
    weight: "0.8 kg",
    price: 987,
    purDate: "11 Jan 2019",
    delDate: "14 Jan 2019",
    status: "Delivered",
    color: "success",
  },
  {
    id: 3,
    orderId: Math.floor(Math.random() * 3000000),
    customer: "Constance Clayton",
    office: "Peru",
    weight: "105 kg",
    price: 1876,
    purDate: "09 Jan 2019",
    delDate: "-",
    status: "Canceled",
    color: "secondary",
  },
  {
    id: 4,
    orderId: Math.floor(Math.random() * 3000000),
    customer: "Cherokee Ware",
    office: "Belgium",
    weight: "0.8 kg",
    price: 987,
    purDate: "11 Jan 2019",
    delDate: "14 Jan 2019",
    status: "Delivered",
    color: "success",
  },
  {
    id: 5,
    orderId: Math.floor(Math.random() * 3000000),
    customer: "Constance Clayton",
    office: "Peru",
    weight: "105 kg",
    price: 1876,
    purDate: "06 Jan 2019",
    delDate: "19 Jan 2019",
    status: "In a process",
    color: "warning",
  },
  {
    id: 6,
    orderId: Math.floor(Math.random() * 3000000),
    customer: "Constance Clayton",
    office: "Peru",
    weight: "105 kg",
    price: 1876,
    purDate: "06 Jan 2019",
    delDate: "19 Jan 2019",
    status: "In a process",
    color: "warning",
  },
];

// Utility Functions
const desc = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

const stableSort = (array, comparator) => {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
};

const getSorting = (order, orderBy) =>
  order === "desc" ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);

// Components
const EnhancedTableHead = ({
  classes,
  onSelectAllClick,
  order,
  orderBy,
  numSelected,
  rowCount,
  onRequestSort,
}) => {
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
        {HEAD_CELLS.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "left" : "right"}
            padding={headCell.disablePadding ? "none" : null}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={order}
              onClick={createSortHandler(headCell.id)}
              style={{
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                fontSize: "0.85rem",
              }}
            >
              <Typography uppercase color="text" variant="body2" colorBrightness="hint">
                {headCell.label}
              </Typography>
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
};

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = () => {
  const theme = useTheme();
  return {
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
  };
};

const EnhancedTableToolbar = ({ numSelected }) => {
  const classes = useToolbarStyles();

  return (
    <Toolbar
      className={cn({
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color="inherit" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <Box display="flex" className={classes.title}>
          <Typography
            variant="h6"
            color="text"
            colorBrightness="secondary"
            id="tableTitle"
            style={{ display: "flex" }}
          >
            Recent Orders
            <Box display="flex" alignSelf="flex-end" ml={1}>
              <Typography color="text" colorBrightness="hint" variant="caption">
                1.340 total
              </Typography>
            </Box>
          </Typography>
        </Box>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton aria-label="delete">
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
};

const SupportTracker = ({ classes, theme }) => (
  <Widget title="Support Tracker" bodyClass={classes.fullHeightBody} className={classes.card}>
    <Grid container spacing={3} alignItems="center">
      <Grid size={6}>
        <Box display="flex">
          <Typography variant="h2" weight="medium">
            543
          </Typography>
          <Typography
            color="text"
            variant="caption"
            noWrap
            style={{ alignSelf: "flex-end", marginLeft: 8 }}
          >
            Tickets
          </Typography>
        </Box>
      </Grid>
      <Grid
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
        }}
        size={6}
      >
        <Typography variant="caption" weight="medium" style={{ position: "absolute" }}>
          64%
        </Typography>
        <ResponsiveContainer width="100%" height={80}>
          <PieChart>
            <Pie
              data={TICKET_CHART_DATA}
              startAngle={270}
              endAngle={0}
              paddingAngle={5}
              innerRadius={30}
              outerRadius={35}
              dataKey="value"
              style={{ border: 0 }}
            >
              {TICKET_CHART_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={theme.palette[entry.color].main}
                  stroke=""
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Grid>
    </Grid>
    <Grid
      container
      direction="row"
      justify="space-between"
      alignItems="center"
      wrap="nowrap"
    >
      {[
        { label: "New Tickets", value: 45, color: "success" },
        { label: "Open", value: 147, color: "warning" },
        { label: "Completed", value: 351, color: "primary" },
      ].map((item) => (
        <Grid key={item.label}>
          <Typography
            color="text"
            colorBrightness="hint"
            variant="caption"
            style={{ marginRight: 5 }}
            noWrap
          >
            {item.label}
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Typography size="md" weight="medium" style={{ marginRight: 8 }}>
              {item.value}
            </Typography>
            <Dot color={item.color} />
          </Box>
        </Grid>
      ))}
    </Grid>
  </Widget>
);

const RevenueBreakdown = ({ classes, theme }) => (
  <Widget
    title="Revenue Breakdown"
    className={classes.card}
    bodyClass={classes.alignStandaloneElement}
  >
    <Grid container spacing={3}>
      <Grid
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 6,
        }}
        size={6}
      >
        <Typography variant="caption" weight="medium" style={{ position: "absolute" }}>
          1700
        </Typography>
        <ResponsiveContainer width="100%" height={144}>
          <PieChart>
            <Pie
              data={PIE_CHART_DATA}
              innerRadius={30}
              outerRadius={40}
              dataKey="value"
            >
              {PIE_CHART_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={theme.palette[entry.color].main}
                  stroke=""
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Grid>
      <Grid size={6}>
        <div className={classes.pieChartLegendWrapper}>
          {PIE_CHART_DATA.map(({ name, value, color }) => (
            <div key={color} className={classes.legendItemContainer}>
              <Dot color={color} style={{ marginRight: 5 }} />
              <Typography
                color="text"
                colorBrightness="hint"
                variant="caption"
                noWrap
              >
                &nbsp;{name}&nbsp;
              </Typography>
              <Typography color="text" weight="medium">
                &nbsp;{value}
              </Typography>
            </div>
          ))}
        </div>
      </Grid>
    </Grid>
  </Widget>
);

const AppPerformance = ({ classes }) => (
  <Widget title="App Performance" className={classes.card} bodyClass={classes.fullHeightBody}>
    <div className={classes.performanceLegendWrapper}>
      {[
        { color: "warning", label: "Integration" },
        { color: "primary", label: "SDK" },
      ].map((item) => (
        <div key={item.color} className={classes.legendElement}>
          <Dot color={item.color} />
          <Typography
            color="text"
            colorBrightness="hint"
            variant="body2"
            className={classes.legendElementText}
          >
            {item.label}
          </Typography>
        </div>
      ))}
    </div>
    <div className={classes.progressSection}>
      <Typography color="text" variant="body2" className={classes.progressSectionTitle}>
        Integration
      </Typography>
      <LinearProgress
        variant="determinate"
        value={77}
        classes={{ barColorPrimary: classes.progressBarPrimary }}
        className={classes.progress}
      />
    </div>
    <div>
      <Typography color="text" variant="body2" className={classes.progressSectionTitle}>
        SDK
      </Typography>
      <LinearProgress
        variant="determinate"
        value={73}
        classes={{ barColorPrimary: classes.progressBarWarning }}
        className={classes.progress}
      />
    </div>
  </Widget>
);

const ServerOverview = ({ classes, theme, randomData }) => (
  <Widget title="Server Overview" className={classes.card} bodyClass={classes.fullHeightBody}>
    {[
      { label: "60% / 37°С / 3.3 Ghz", color: "secondary" },
      { label: "54% / 31°С / 3.3 Ghz", color: "primary" },
      { label: "57% / 21°С / 3.3 Ghz", color: "warning" },
    ].map((item) => (
      <div key={item.label} className={classes.serverOverviewElement}>
        <Typography
          color="text"
          noWrap
          variant="body2"
          weight="medium"
          className={classes.serverOverviewElementText}
        >
          {item.label}
        </Typography>
        <div className={classes.serverOverviewElementChartWrapper}>
          <ResponsiveContainer height={50} width="99%">
            <AreaChart data={randomData}>
              <Area
                type="natural"
                dataKey="value"
                stroke={theme.palette[item.color].main}
                fill={theme.palette[item.color].light}
                strokeWidth={2}
                fillOpacity="0.25"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    ))}
  </Widget>
);

const MainChart = ({ classes, theme, mainChartState, mainChartData, setMainChartState }) => (
  <Widget
    bodyClass={classes.mainChartBody}
    header={
      <div className={classes.mainChartHeader}>
        <Typography variant="h6" color="text" weight="medium" colorBrightness="secondary">
          Daily Line Chart
        </Typography>
        <div className={classes.mainChartHeaderLabels}>
          {[
            { color: "warning", label: "Tablet" },
            { color: "primary", label: "Mobile" },
            { color: "secondary", label: "Desktop" },
          ].map((item) => (
            <div key={item.color} className={classes.mainChartHeaderLabel}>
              <Dot color={item.color} />
              <Typography className={classes.mainChartLegendElement}>
                {item.label}
              </Typography>
            </div>
          ))}
        </div>
        <Select
          value={mainChartState}
          onChange={(e) => setMainChartState(e.target.value)}
          input={
            <OutlinedInput
              classes={{
                notchedOutline: classes.mainChartSelectRoot,
                input: classes.mainChartSelect,
              }}
            />
          }
          autoWidth
          className={classes.fixIconRight}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
      </div>
    }
  >
    <ResponsiveContainer width="100%" minWidth={500} height={350}>
      <ComposedChart margin={{ top: 0, right: -15, left: -15, bottom: 0 }} data={mainChartData}>
        <YAxis
          ticks={[0, 2500, 5000, 7500]}
          tick={{
            fill: theme.palette.text.hint + "80",
            fontSize: 14,
          }}
          stroke={theme.palette.text.hint + "80"}
          tickLine={false}
        />
        <XAxis
          tickFormatter={(i) => i + 1}
          tick={{
            fill: theme.palette.text.hint + "80",
            fontSize: 14,
          }}
          stroke={theme.palette.text.hint + "80"}
          tickLine={false}
        />
        <Tooltip />
        <Area
          type="natural"
          dataKey="desktop"
          fill={theme.palette.background.light}
          strokeWidth={0}
          activeDot={false}
        />
        <Line
          type="natural"
          dataKey="mobile"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={false}
          activeDot={false}
        />
        <Line
          type="linear"
          dataKey="tablet"
          stroke={theme.palette.warning.main}
          strokeWidth={2}
          dot={{
            stroke: theme.palette.warning.dark,
            strokeWidth: 2,
            fill: theme.palette.warning.main,
          }}
          activeDot={{ r: 8 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </Widget>
);

const RecentOrdersTable = ({
  classes,
  theme,
  rows,
  order,
  orderBy,
  selected,
  page,
  rowsPerPage,
  actionsMenuAnchorEl,
  actionsMenuRowId,
  handleRequestSort,
  handleSelectAllClick,
  handleClick,
  handleChangePage,
  handleChangeRowsPerPage,
  handleActionsMenuOpen,
  handleActionsMenuClose,
  isSelected,
  emptyRows,
}) => (
  <Widget noBodyPadding bodyClass={classes.tableWidget}>
    <EnhancedTableToolbar numSelected={selected.length} />
    <div className={classes.tableWrapper}>
      <Table className={classes.table} aria-labelledby="tableTitle" aria-label="recent orders">
        <EnhancedTableHead
          classes={classes}
          numSelected={selected.length}
          order={order}
          orderBy={orderBy}
          onSelectAllClick={handleSelectAllClick}
          onRequestSort={handleRequestSort}
          rowCount={rows.length}
        />
        <TableBody>
          {stableSort(rows, getSorting(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => {
              const isItemSelected = isSelected(row.id);
              const labelId = `orders-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={(event) => handleClick(event, row.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.id}
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isItemSelected}
                      inputProps={{ "aria-labelledby": labelId }}
                    />
                  </TableCell>
                  <TableCell component="th" id={labelId} scope="row" padding="none">
                    {row.orderId}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="nowrap" alignItems="center">
                      <Avatar
                        alt={row.customer}
                        color={row.color}
                        style={{ marginRight: 8 }}
                      >
                        {row.customer[0]}
                      </Avatar>
                      <Typography style={{ whiteSpace: "nowrap" }}>
                        {row.customer}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.office}</TableCell>
                  <TableCell>{row.weight}</TableCell>
                  <TableCell>${row.price}</TableCell>
                  <TableCell>{row.purDate}</TableCell>
                  <TableCell>{row.delDate}</TableCell>
                  <TableCell>
                    <Chip label={row.status} color={row.color} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      className={classes.actionsIcon}
                      aria-controls={actionsMenuRowId === row.id ? "actions-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={actionsMenuRowId === row.id ? "true" : undefined}
                      onClick={(e) => handleActionsMenuOpen(e, row.id)}
                    >
                      <MoreIcon />
                    </IconButton>

                    <Menu
                      id="actions-menu"
                      open={actionsMenuRowId === row.id}
                      anchorEl={actionsMenuAnchorEl}
                      onClose={handleActionsMenuClose}
                      disableAutoFocusItem
                    >
                      <MenuItem>
                        <Typography>Edit</Typography>
                      </MenuItem>
                      <MenuItem>
                        <Typography>Delete</Typography>
                      </MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              );
            })}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    <TablePagination
      rowsPerPageOptions={[5, 10, 25]}
      component="div"
      count={rows.length}
      rowsPerPage={rowsPerPage}
      page={page}
      backIconButtonProps={{ "aria-label": "previous page" }}
      nextIconButtonProps={{ "aria-label": "next page" }}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  </Widget>
);

const getRandomData = (length, min = 0, max = 100, multiplier = 10, maxDiff = 10) => {
  let array = new Array(length).fill();
  let lastValue;

  return array.map(() => {
    let randomValue = Math.floor(Math.random() * multiplier + 1);

    while (
      randomValue <= min ||
      randomValue >= max ||
      (lastValue && randomValue - lastValue > maxDiff)
    ) {
      randomValue = Math.floor(Math.random() * multiplier + 1);
    }

    lastValue = randomValue;

    return { value: randomValue };
  });
};

const Dashboard = () => {
  const classes = useStyles();
  const theme = useTheme();

  // State
  const [mainChartState, setMainChartState] = useState("monthly");
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("price");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [actionsMenuAnchorEl, setActionsMenuAnchorEl] = useState(null);
  const [actionsMenuRowId, setActionsMenuRowId] = useState(null);

  // Handlers
  const handleRequestSort = (event, property) => {
    const isDesc = orderBy === property && order === "desc";
    setOrder(isDesc ? "asc" : "desc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = INITIAL_ROWS.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleActionsMenuOpen = (event, rowId) => {
    event.stopPropagation();
    setActionsMenuAnchorEl(event.currentTarget);
    setActionsMenuRowId(rowId);
  };

  const handleActionsMenuClose = () => {
    setActionsMenuAnchorEl(null);
    setActionsMenuRowId(null);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Memoized Data
  const randomData = useMemo(() => getRandomData(10), []);

  const mainChartData = useMemo(() => {
    const tablet = getRandomData(31, 3500, 6500, 7500, 1000);
    const desktop = getRandomData(31, 1500, 7500, 7500, 1500);
    const mobile = getRandomData(31, 1500, 7500, 7500, 1500);

    return tablet.map((_, i) => ({
      tablet: tablet[i].value,
      desktop: desktop[i].value,
      mobile: mobile[i].value,
    }));
  }, [mainChartState]);

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, INITIAL_ROWS.length - page * rowsPerPage);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SupportTracker classes={classes} theme={theme} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <RevenueBreakdown classes={classes} theme={theme} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AppPerformance classes={classes} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <ServerOverview classes={classes} theme={theme} randomData={randomData} />
      </Grid>
      <Grid size={12}>
        <MainChart
          classes={classes}
          theme={theme}
          mainChartState={mainChartState}
          mainChartData={mainChartData}
          setMainChartState={setMainChartState}
        />
      </Grid>
      {mock.bigStat.map((stat) => (
        <Grid key={stat.product} size={{ xs: 12, sm: 6, md: 4 }}>
          <BigStat {...stat} />
        </Grid>
      ))}
      <Grid size={12}>
        <RecentOrdersTable
          classes={classes}
          theme={theme}
          rows={INITIAL_ROWS}
          order={order}
          orderBy={orderBy}
          selected={selected}
          page={page}
          rowsPerPage={rowsPerPage}
          actionsMenuAnchorEl={actionsMenuAnchorEl}
          actionsMenuRowId={actionsMenuRowId}
          handleRequestSort={handleRequestSort}
          handleSelectAllClick={handleSelectAllClick}
          handleClick={handleClick}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleActionsMenuOpen={handleActionsMenuOpen}
          handleActionsMenuClose={handleActionsMenuClose}
          isSelected={isSelected}
          emptyRows={emptyRows}
        />
      </Grid>
    </Grid>
  );
};

export default Dashboard;