import React from 'react';
import {
  Grid,
  Box,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField as Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import dayjs from 'utils/dayjs';
import Widget from '../../components/Widget';
import { Button, Typography, Chip, Avatar, Link } from '../../components/Wrappers';
import Notification from '../../components/Notification/Notification';
import { toast } from 'react-toastify';
import {
  Add as AddIcon,
  GetApp as DownloadIcon,
  Search as SearchIcon,
  CreateOutlined as CreateIcon,
  HelpOutline as HelpIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material';
import { useManagementDispatch, useManagementState } from '../../context/ManagementContext';
import { actions } from '../../context/ManagementContext';
import useStyles from './styles';

// --- Constants ---
const HEAD_CELLS = [
  { id: 'id', numeric: true, disablePadding: true, label: 'ID' },
  { id: 'name', numeric: false, disablePadding: false, label: 'NAME' },
  { id: 'role', numeric: false, disablePadding: false, label: 'ROLE' },
  { id: 'companyName', numeric: false, disablePadding: false, label: 'COMPANY NAME' },
  { id: 'email', numeric: false, disablePadding: false, label: 'EMAIL' },
  { id: 'status', numeric: false, disablePadding: false, label: 'STATUS' },
  { id: 'created', numeric: false, disablePadding: false, label: 'CREATED AT' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'ACTIONS' },
];

const DEFAULT_ROWS_PER_PAGE = 5;
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

// --- Utilities ---
const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

const getComparator = (order, orderBy) =>
  order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
};

// --- Subcomponents ---
const EnhancedTableHead = ({
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
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all users' }}
          />
        </TableCell>
        {HEAD_CELLS.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'left' : 'right'}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              <Typography noWrap weight="medium" variant="body2">
                {headCell.label}
              </Typography>
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

// --- Main Component ---
const UserList = () => {
  // --- State ---
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('id');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_ROWS_PER_PAGE);
  const [usersRows, setUsersRows] = React.useState([]);

  // --- Context ---
  const managementDispatch = useManagementDispatch();
  const { rows, modalOpen, idToDelete } = useManagementState();

  // --- Styles ---
  const classes = useStyles();

  // --- Effects ---
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        await actions.doFetch({}, false)(managementDispatch);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
    sendNotification('This page is only available in React Material Admin Full with Node.js integration!');
  }, [managementDispatch]);

  React.useEffect(() => {
    setUsersRows(rows);
  }, [rows]);

  // --- Handlers ---
  const sendNotification = (text) => {
    const componentProps = {
      type: 'feedback',
      message: text,
      variant: 'contained',
      color: 'success',
    };
    const options = {
      type: 'info',
      position: toast.POSITION.TOP_RIGHT,
      progressClassName: classes.progress,
      className: classes.notification,
      timeOut: 1000,
    };
    toast(<Notification {...componentProps} className={classes.notificationComponent} />, options);
  };

  const openModal = (userId) => {
    actions.doOpenConfirm(userId)(managementDispatch);
  };

  const closeModal = () => {
    actions.doCloseConfirm()(managementDispatch);
  };

  const handleDelete = () => {
    actions.doDelete(idToDelete)(managementDispatch);
    sendNotification('User deleted');
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((user) => user.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, userId) => {
    const selectedIndex = selected.indexOf(userId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, userId];
    } else if (selectedIndex === 0) {
      newSelected = [...selected.slice(1)];
    } else if (selectedIndex === selected.length - 1) {
      newSelected = [...selected.slice(0, -1)];
    } else if (selectedIndex > 0) {
      newSelected = [...selected.slice(0, selectedIndex), ...selected.slice(selectedIndex + 1)];
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

  const isSelected = (userId) => selected.indexOf(userId) !== -1;

  const handleSearch = (e) => {
    const searchTerm = e.currentTarget.value.toLowerCase();
    const filteredRows = usersRows.filter((user) =>
      user.name.toLowerCase().includes(searchTerm)
    );
    setUsersRows(filteredRows);
  };

  // --- Derived Values ---
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, usersRows.length - page * rowsPerPage);

  const visibleRows = React.useMemo(
    () =>
      stableSort(usersRows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [usersRows, order, orderBy, page, rowsPerPage]
  );

  // --- Render Helpers ---
  const renderUserAvatar = (user) => {
    if (user.avatars?.length) {
      const lastAvatar = user.avatars[user.avatars.length - 1];
      return (
        <Avatar
          alt={user.name}
          src={lastAvatar.publicUrl}
          style={{ marginRight: 15 }}
        />
      );
    }
    return (
      <Avatar
        alt={user.name}
        style={{ marginRight: 15, backgroundColor: '#536DFE' }}
      >
        {user.email.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  const renderStatusChip = (user) => (
    <Chip
      color={user.statusColor}
      label={user.emailVerified && user.password ? 'active' : 'inactive'}
      style={{
        color: '#fff',
        height: 16,
        backgroundColor: user.emailVerified && user.password ? '#3CD4A0' : '#FF5C93',
        fontSize: 11,
        fontWeight: 'bold',
      }}
    />
  );

  const renderActionButtons = (userId) => (
    <Box display="flex" style={{ marginLeft: -12 }}>
      <IconButton color="primary">
        <Link href={`#app/user/${userId}/edit`} color="#fff">
          <CreateIcon />
        </Link>
      </IconButton>
      <IconButton color="primary">
        <Link href={`#app/user/${userId}`} color="#fff">
          <HelpIcon />
        </Link>
      </IconButton>
      <IconButton onClick={() => openModal(userId)} color="primary">
        <DeleteIcon />
      </IconButton>
    </Box>
  );

  // --- Render ---
  return (
    <Grid container spacing={3}>
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        scroll="body"
        aria-labelledby="scroll-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">Are you sure that you want to delete user?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            User will be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="primary">
            Disagree
          </Button>
          <Button onClick={handleDelete} color="primary" autoFocus>
            Agree
          </Button>
        </DialogActions>
      </Dialog>

      <Grid item xs={12}>
        <Widget inheritHeight>
          <Box
            justifyContent="space-between"
            display="flex"
            alignItems="flex-start"
          >
            <Box>
              <Link href="/app/user/new" underline="none" color="#fff">
                <Button variant="contained" color="success">
                  <Box mr={1} display="flex">
                    <AddIcon />
                  </Box>
                  Add
                </Button>
              </Link>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <Button variant="outlined" color="secondary">
                <Box display="flex" mr={1}>
                  <DownloadIcon />
                </Box>
                Download
              </Button>
              <Input
                style={{ marginTop: 16 }}
                id="search-field"
                label="Search"
                margin="dense"
                variant="outlined"
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </Widget>
      </Grid>

      <Grid item xs={12}>
        <Widget inheritHeight noBodyPadding>
          <TableContainer>
            <Table aria-labelledby="tableTitle" size="medium" aria-label="enhanced table">
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={usersRows.length}
              />
              <TableBody>
                {visibleRows.map((row, index) => {
                  const isItemSelected = isSelected(row.id);
                  const labelId = `enhanced-table-checkbox-${index}`;

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
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                      <TableCell component="th" id={labelId} scope="row" padding="none">
                        <Typography variant="body2">{index + 1}</Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Box display="flex" alignItems="center">
                          {renderUserAvatar(row)}
                          <Typography variant="body2" noWrap>
                            {row.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="left">
                        <Typography variant="body2">{row.role}</Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Typography variant="body2">Flatlogic</Typography>
                      </TableCell>
                      <TableCell align="left">
                        <Typography variant="body2">{row.email}</Typography>
                      </TableCell>
                      <TableCell align="left">{renderStatusChip(row)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {dayjs(row.createdAt).format('YYYY-DD-MM')}
                        </Typography>
                      </TableCell>
                      <TableCell align="left">{renderActionButtons(row.id)}</TableCell>
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={HEAD_CELLS.length} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            component="div"
            count={usersRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Widget>
      </Grid>
    </Grid>
  );
};

export default UserList;