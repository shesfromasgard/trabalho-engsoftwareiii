import React, { useState, useRef } from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import { useNavigate } from 'react-router-dom';
import useStyles from './styles';
import { toast } from 'react-toastify';
import Axios from 'axios';
import config from '../../config';
import uuid from 'uuid/v4';

import Notification from "../../components/Notification";
import { Button, Typography } from '../../components/Wrappers';
import Widget from '../../components/Widget';

import { actions, useManagementDispatch } from '../../context/ManagementContext';

const TOTAL_STEPS = 4;
const LAST_STEP_INDEX = TOTAL_STEPS - 1;

function getSteps() {
  return ['Create Account', 'User Details', 'Business Details', 'Social'];
}

function getStepContent(step) {
  switch (step) {
    case 0:
      return 'Create New Account';
    case 1:
      return 'Create User Details';
    case 2:
      return 'Business Details';
    case 3:
      return 'Social';
    default:
      return '';
  }
}

function extractExtensionFrom(filename) {
  if (!filename) {
    return null;
  }
  const regex = /(?:\.([^.]+))?$/;
  return regex.exec(filename)[1];
}

const uploadToServer = async (file, path, filename) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', filename);
  
  const uri = `${config.baseURLApi}/file/upload/${path}`;
  await Axios.post(uri, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const privateUrl = `${path}/${filename}`;
  return `${config.baseURLApi}/file/download?privateUrl=${privateUrl}`;
};

const AccountStep = ({ newUser, handleChange }) => (
  <>
    <TextField
      id="outlined-basic"
      label="Username"
      onChange={handleChange}
      name="fullName"
      value={newUser.fullName || ''}
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Please enter your username"
    />
    <TextField
      id="outlined-basic"
      label="Email Address"
      onChange={handleChange}
      value={newUser.email || ''}
      name="email"
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="We’ll never share your email with anyone else"
      type="email"
    />
    <TextField
      id="outlined-basic"
      label="Password"
      onChange={handleChange}
      name="password"
      value={newUser.password || ''}
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your password. Min 6 characters long"
      type="password"
    />
    <FormControl variant="outlined" onChange={handleChange} style={{ marginBottom: 35 }}>
      <InputLabel id="demo-simple-select-outlined-label">Role</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value={newUser.role || 'user'}
        defaultValue="User"
        name="role"
        onChange={handleChange}
        label="Role"
      >
        <MenuItem value="user">User</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
      </Select>
      <FormHelperText id="demo-simple-select-outlined">Please choose the role</FormHelperText>
    </FormControl>
  </>
);

const UserDetailsStep = ({ newUser, handleChange, classes, fileInput, handleFile, deleteOneImage }) => (
  <>
    <Typography weight="medium">Photo:</Typography>
    <div className={classes.galleryWrap}>
      {newUser && newUser.avatars && newUser.avatars.length !== 0
        ? newUser.avatars.map((avatar) => (
            <div key={avatar.id} className={classes.imgWrap}>
              <span className={classes.deleteImageX} onClick={() => deleteOneImage(avatar.id)}>
                ×
              </span>
              <img src={avatar.publicUrl} alt="avatar" height="100%" />
            </div>
          ))
        : null}
    </div>
    <label className={classes.uploadLabel} style={{ cursor: 'pointer' }}>
      Upload an image
      <input
        style={{ display: 'none' }}
        accept="image/*"
        type="file"
        ref={fileInput}
        onChange={handleFile}
      />
    </label>
    <Typography size="sm" style={{ marginBottom: 35 }}>
      .PNG, .JPG, .JPEG
    </Typography>
    <TextField
      id="outlined-basic"
      label="First Name"
      onChange={handleChange}
      name="firstName"
      value={newUser.firstName || ''}
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your first name"
    />
    <TextField
      id="outlined-basic"
      label="Last Name"
      onChange={handleChange}
      name="lastName"
      value={newUser.lastName || ''}
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your last name"
    />
    <TextField
      id="outlined-basic"
      label="Contact number"
      onChange={handleChange}
      value={newUser.phoneNumber || ''}
      name="phoneNumber"
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your contact number "
    />
    <TextField
      id="outlined-basic"
      label="Email"
      variant="outlined"
      value={newUser.email || ''}
      style={{ marginBottom: 35 }}
      helperText="Enter your email"
      type="email"
    />
    <FormControl variant="outlined" style={{ marginBottom: 35 }}>
      <InputLabel id="demo-simple-select-outlined-label">Country</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value={newUser.role || 'user'}
        defaultValue="User"
        name="role"
        onChange={handleChange}
        label="Role"
      >
        <MenuItem value="user">User</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
      </Select>
      <FormHelperText id="demo-simple-select-outlined">Choose your role</FormHelperText>
    </FormControl>
    <FormControl variant="outlined" style={{ marginBottom: 35 }}>
      <InputLabel id="demo-simple-select-outlined-label">State</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value=""
        label="State"
      >
        <MenuItem value={10}>User</MenuItem>
        <MenuItem value={20}>Admin</MenuItem>
        <MenuItem value={30}>Super Admin</MenuItem>
      </Select>
      <FormHelperText id="demo-simple-select-outlined">Choose your state</FormHelperText>
    </FormControl>
    <FormControl variant="outlined" style={{ marginBottom: 35 }}>
      <InputLabel id="demo-simple-select-outlined-label">City</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value=""
        label="City"
      >
        <MenuItem value={10}>User</MenuItem>
        <MenuItem value={20}>Admin</MenuItem>
        <MenuItem value={30}>Super Admin</MenuItem>
      </Select>
      <FormHelperText id="demo-simple-select-outlined">Choose your city</FormHelperText>
    </FormControl>
    <TextField
      id="outlined-basic"
      label="Address"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your adress"
    />
  </>
);

const BusinessDetailsStep = ({ handleChange }) => (
  <>
    <TextField
      id="outlined-basic"
      label="Company Name"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your company name"
    />
    <TextField
      id="outlined-basic"
      label="Company Registered ID"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your company registered ID"
    />
    <TextField
      id="outlined-basic"
      label="Cmpany Email"
      onChange={handleChange}
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your company email"
    />
    <TextField
      id="outlined-basic"
      value=""
      label="Company Contact"
      onChange={handleChange}
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your company cpntact"
    />
  </>
);

const SocialStep = ({ handleChange }) => (
  <>
    <TextField
      id="outlined-basic"
      label="Facebook"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your Facebook link"
    />
    <TextField
      id="outlined-basic"
      label="Twitter"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your Twitter link"
    />
    <TextField
      id="outlined-basic"
      label="Instagram"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your Instagram link"
    />
    <TextField
      id="outlined-basic"
      label="GitHub"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your GitHub link"
    />
    <TextField
      id="outlined-basic"
      label="CodePen"
      variant="outlined"
      onChange={handleChange}
      style={{ marginBottom: 35 }}
      helperText="Enter your CodePen link"
    />
    <TextField
      id="outlined-basic"
      label="Slack"
      variant="outlined"
      style={{ marginBottom: 35 }}
      helperText="Enter your Slack link"
    />
  </>
);

const AddUser = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set());
  const [newUser, setNewUser] = useState({
    avatars: [],
    disabled: null,
    email: '',
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    emailVerified: true,
    firstName: '',
    fullName: '',
    lastName: '',
    password: null,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    phoneNumber: '',
    role: 'user',
  });

  const fileInput = useRef(null);
  const steps = getSteps();
  const classes = useStyles();
  const managementDispatch = useManagementDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value,
    });
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    const extension = extractExtensionFrom(file.name);
    const id = uuid();
    const filename = `${id}.${extension}`;
    const privateUrl = `users/avatar/${filename}`;

    const publicUrl = await uploadToServer(file, 'users/avatar', filename);
    
    const avatarObj = {
      id,
      name: file.name,
      sizeInBytes: file.size,
      privateUrl,
      publicUrl,
      new: true,
    };

    setNewUser({
      ...newUser,
      avatars: [...newUser.avatars, avatarObj],
    });
  };

  const isStepSkipped = (step) => skipped.has(step);

  const doSubmit = (id, data) => {
    actions.doCreate(data, navigate)(managementDispatch);
  };

  const sendNotification = () => {
    const componentProps = {
      type: 'feedback',
      message: 'User added!',
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
      options
    );
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);

    if (activeStep === LAST_STEP_INDEX) {
      doSubmit(null, newUser);
      sendNotification();
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const deleteOneImage = (id) => {
    setNewUser({
      ...newUser,
      avatars: newUser.avatars.filter((avatar) => avatar.id !== id),
    });
  };

  const renderStepFields = () => {
    switch (activeStep) {
      case 0:
        return <AccountStep newUser={newUser} handleChange={handleChange} />;
      case 1:
        return (
          <UserDetailsStep
            newUser={newUser}
            handleChange={handleChange}
            classes={classes}
            fileInput={fileInput}
            handleFile={handleFile}
            deleteOneImage={deleteOneImage}
          />
        );
      case 2:
        return <BusinessDetailsStep handleChange={handleChange} />;
      default:
        return <SocialStep handleChange={handleChange} />;
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Widget>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => {
              const stepProps = {};
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel classes={{ completed: classes.stepCompleted }}>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Widget>
      </Grid>
      <Grid size={12}>
        <Widget>
          <Grid justify="center" container>
            <Box display="flex" flexDirection="column" width={600}>
              <Typography variant="h5" weight="medium" style={{ marginBottom: 30 }}>
                {getStepContent(activeStep)}
              </Typography>
              
              {renderStepFields()}

              <div>
                <div>
                  {activeStep === 0 ? (
                    <Box display="flex" justifyContent="flex-end">
                      <Button variant="contained" color="primary" onClick={handleNext}>
                        Next
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" justifyContent="space-between">
                      <Button onClick={handleBack} variant="outlined" color="primary">
                        Back
                      </Button>
                      <Button variant="contained" color="primary" onClick={handleNext}>
                        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </Box>
                  )}
                </div>
              </div>
            </Box>
          </Grid>
        </Widget>
      </Grid>
    </Grid>
  );
};

export default AddUser;