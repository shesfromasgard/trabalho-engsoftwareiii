import React, { useEffect, useState } from 'react';
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
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  GetApp as DownloadIcon,
  Search as SearchIcon,
  CreateOutlined as CreateIcon,
  HelpOutline as HelpIcon,
  DeleteOutlined as DeleteIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import dayjs from 'utils/dayjs';

import Widget from '../../components/Widget';
import Notification from '../../components/Notification/Notification';
import { Typography, Chip, Avatar, Link, Button } from '../../components/Wrappers';
import { useManagementDispatch, useManagementState, actions } from '../../context/ManagementContext';
import useStyles from './styles';

// --- Helper Functions for Sorting ---
const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
};

// --- Table Configuration ---
const headCells = [
  { id: 'id', numeric: true, disablePadding: true, label: 'ID' },
  { id: 'name', numeric: true, disablePadding: false, label: 'NAME' },
  { id: 'role', numeric: true, disablePadding: false, label: 'ROLE' },
  { id: 'companyName', numeric: true, disablePadding: false, label: 'COMPANY NAME' },
  { id: 'email', numeric: true, disablePadding: false, label: 'EMAIL' },
  { id: 'status', numeric: true, disablePadding: false, label: 'STATUS' },
  { id: 'created', numeric: false, disablePadding: false, label: 'CREATED AT' },
  { id: 'actions', numeric: true, disablePadding: false, label: 'ACTIONS' }
];

// --- Sub-components ---
function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) {
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
        {headCells.map((headCell) => (
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

// --- Main Component ---
const UserList = () => {
  const classes = useStyles();
  
  // State Management
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('calories');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [dense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [usersRows, setUsersRows] = useState([]);

  // Context Hooks
  const managementDispatch = useManagementDispatch();
  const managementValue = useManagementState();

  // Notification Helper
  const sendNotification = (text) => {
    const componentProps = {
      type: 'feedback',
      message: text,
      variant: 'contained',
      color: 'success'
    };
    
    const options = {
      type: 'info',
      position: toast.POSITION.TOP_RIGHT,
      progressClassName: classes.progress,
      className: classes.notification,
      timeOut: 1000
    };

    return toast(
      <Notification {...componentProps} className={classes.notificationComponent} />,
      options
    );
  };

  // Modal Handlers
  const openModal = (cell) => {
    actions.doOpenConfirm(cell)(managementDispatch);
  };

  const closeModal = () => {
    actions.doCloseConfirm()(managementDispatch);
  };

  const handleDelete = () => {
    actions.doDelete(managementValue.idToDelete)(managementDispatch);
    sendNotification('User deleted');
  };

  // Effects
  useEffect(() => {
    sendNotification('This page is only available in React Material Admin Full with Node.js integration!');
    
    const fetchAPI = async () => {
      try {
        await actions.doFetch({}, false)(managementDispatch);
        setUsersRows(managementValue.rows);
      } catch (e) {
        console.log(e);
      }
    };
    
    fetchAPI();
  }, []);

  useEffect(() => {
    setUsersRows(managementValue.rows);
  }, [managementValue.rows]);

  // Table Event Handlers
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = managementValue.rows.map((n) => n.id);
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

  const handleSearch = (e) => {
    const query = e.currentTarget.value.toLowerCase();
    const filteredRows = usersRows.filter((user) => 
      user.name.toLowerCase().includes(query)
    );
    setUsersRows(filteredRows);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, usersRows.length - page * rowsPerPage);

  return (
    <Grid container spacing={3}>
      {/* Confirmation Dialog */}
      <Dialog
        open={managementValue.modalOpen}
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

      {/* Top Action Bar */}
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
                  )
                }}
              />
            </Box>
          </Box>
        </Widget>
      </Grid>

      {/* Data Table Widget */}
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
                    const isActive = row.emailVerified && row.password;

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
                          <Typography variant="body2">
                            {index + 1}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="left">
                          <Box display="flex" alignItems="center">
                            {!row.avatars.length ? (
                              <Avatar
                                alt={row.name}
                                style={{
                                  marginRight: 15,
                                  backgroundColor: '#536DFE'
                                }}
                              >
                                {row.email.charAt(0).toUpperCase()}
                              </Avatar>
                            ) : (
                              <Avatar
                                alt={row.name}
                                src={row.avatars && row.avatars[0].publicUrl && row.avatars[row.avatars.length - 1].publicUrl}
                                style={{ marginRight: 15 }}
                              />
                            )}
                            <Typography variant="body2" noWrap>
                              {row.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell align="left">
                          <Typography variant="body2">
                            {row.role}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="left">
                          <Typography variant="body2">
                            Flatlogic
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="left">
                          <Typography variant="body2">
                            {row.email}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="left">
                          <Chip
                            color={row.statusColor}
                            label={isActive ? 'active' : 'inactive'}
                            style={{
                              color: '#fff',
                              height: 16,
                              backgroundColor: isActive ? '#3CD4A0' : '#FF5C93',
                              fontSize: 11,
                              fontWeight: 'bold'
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
};

export default UserList;