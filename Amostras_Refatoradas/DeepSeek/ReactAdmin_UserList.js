import React, { useCallback, useEffect, useState } from 'react';
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
} from '@mui/material';
import {
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
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import {
  Add as AddIcon,
  GetApp as DownloadIcon,
  Search as SearchIcon,
  CreateOutlined as CreateIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import dayjs from 'utils/dayjs';
import Widget from '../../components/Widget';
import { Button, Typography, Chip, Avatar, Link } from '../../components/Wrappers';
import Notification from '../../components/Notification/Notification';
import { toast } from 'react-toastify';
import {
  useManagementDispatch,
  useManagementState,
  actions,
} from '../../context/ManagementContext';
import useStyles from './styles';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const result = comparator(a[0], b[0]);
    return result !== 0 ? result : a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

const HEAD_CELLS = [
  { id: 'id', numeric: true, disablePadding: true, label: 'ID' },
  { id: 'name', numeric: true, disablePadding: false, label: 'NAME' },
  { id: 'role', numeric: true, disablePadding: false, label: 'ROLE' },
  { id: 'companyName', numeric: true, disablePadding: false, label: 'COMPANY NAME' },
  { id: 'email', numeric: true, disablePadding: false, label: 'EMAIL' },
  { id: 'status', numeric: true, disablePadding: false, label: 'STATUS' },
  { id: 'created', numeric: false, disablePadding: false, label: 'CREATED AT' },
  { id: 'actions', numeric: true, disablePadding: false, label: 'ACTIONS' },
];

function EnhancedTableHead({
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
            inputProps={{ 'aria-label': 'select all desserts' }}
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
}

function UserList() {
  const classes = useStyles();
  const managementDispatch = useManagementDispatch();
  const managementState = useManagementState();

  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [dense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [usersRows, setUsersRows] = useState([]);

  const sendNotification = useCallback(
    (text) => {
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
      return toast(
        <Notification {...componentProps} className={classes.notificationComponent} />,
        options,
      );
    },
    [classes],
  );

  const openModal = useCallback(
    (cell) => {
      actions.doOpenConfirm(cell)(managementDispatch);
    },
    [managementDispatch],
  );

  const closeModal = useCallback(() => {
    actions.doCloseConfirm()(managementDispatch);
  }, [managementDispatch]);

  const handleDelete = useCallback(() => {
    actions.doDelete(managementState.idToDelete)(managementDispatch);
    sendNotification('User deleted');
  }, [managementDispatch, managementState.idToDelete, sendNotification]);

  useEffect(() => {
    sendNotification(
      'This page is only available in React Material Admin Full with Node.js integration!',
    );

    async function fetchData() {
      try {
        await actions.doFetch({}, false)(managementDispatch);
        setUsersRows(managementState.rows);
      } catch (e) {
        console.log(e);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once, uses dispatch and state from closure

  useEffect(() => {
    setUsersRows(managementState.rows);
  }, [managementState.rows]);

  const handleRequestSort = useCallback(
    (event, property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [order, orderBy],
  );

  const handleSelectAllClick = useCallback(
    (event) => {
      if (event.target.checked) {
        setSelected(managementState.rows.map((row) => row.id));
      } else {
        setSelected([]);
      }
    },
    [managementState.rows],
  );

  const handleClick = useCallback(
    (event, id) => {
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
    },
    [selected],
  );

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSearch = useCallback(
    (e) => {
      const searchTerm = e.currentTarget.value.toLowerCase();
      const filtered = managementState.rows.filter((row) =>
        row.name.toLowerCase().includes(searchTerm),
      );
      setUsersRows(filtered);
    },
    [managementState.rows],
  );

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, usersRows.length - page * rowsPerPage);

  return (
    <Grid container spacing={3}>
      <Dialog
        open={managementState.modalOpen}
        onClose={closeModal}
        scroll="body"
        aria-labelledby="scroll-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          Are you sure that you want to delete user?
        </DialogTitle>
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

      <Grid size={12}>
        <Widget inheritHeight>
          <Box justifyContent="space-between" display="flex" alignItems="flex-start">
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

      <Grid size={12}>
        <Widget inheritHeight noBodyPadding>
          <TableContainer>
            <Table
              aria-labelledby="tableTitle"
              size={dense ? 'small' : 'medium'}
              aria-label="enhanced table"
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={usersRows.length}
              />
              <TableBody>
                {stableSort(usersRows, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
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
                            {!row.avatars.length ? (
                              <Avatar
                                alt={row.name}
                                style={{ marginRight: 15, backgroundColor: '#536DFE' }}
                              >
                                {row.email.charAt(0).toUpperCase()}
                              </Avatar>
                            ) : (
                              <Avatar
                                alt={row.name}
                                src={
                                  row.avatars &&
                                  row.avatars[0]?.publicUrl &&
                                  row.avatars[row.avatars.length - 1]?.publicUrl
                                }
                                style={{ marginRight: 15 }}
                              />
                            )}
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
                        <TableCell align="left">
                          <Chip
                            color={row.statusColor}
                            label={row.emailVerified && row.password ? 'active' : 'inactive'}
                            style={{
                              color: '#fff',
                              height: 16,
                              backgroundColor:
                                row.emailVerified && row.password ? '#3CD4A0' : '#FF5C93',
                              fontSize: 11,
                              fontWeight: 'bold',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {dayjs(row.createdAt).format('YYYY-DD-MM')}
                          </Typography>
                        </TableCell>
                        <TableCell align="left">
                          <Box display="flex" style={{ marginLeft: -12 }}>
                            <IconButton color="primary">
                              <Link href={`#app/user/${row.id}/edit`} color="#fff">
                                <CreateIcon />
                              </Link>
                            </IconButton>
                            <IconButton color="primary">
                              <Link href={`#app/user/${row.id}`} color="#fff">
                                <HelpIcon />
                              </Link>
                            </IconButton>
                            <IconButton onClick={() => openModal(row.id)} color="primary">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
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
}

export default UserList;