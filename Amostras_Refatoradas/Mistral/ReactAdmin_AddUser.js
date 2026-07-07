import React from 'react';
import Axios from 'axios';
import uuid from 'uuid/v4';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';

import Notification from '../../components/Notification';
import Widget from '../../components/Widget';
import { Button, Typography } from '../../components/Wrappers';
import { actions, useManagementDispatch } from '../../context/ManagementContext';
import config from '../../config';
import useStyles from './styles';

const STEPS = ['Create Account', 'User Details', 'Business Details', 'Social'];
const STEP_CONTENT = ['Create New Account', 'Create User Details', 'Business Details', 'Social'];

const extractExtensionFrom = (filename) => {
  if (!filename) return null;
  const regex = /(?:\.([^.]+))?$/;
  return regex.exec(filename)[1];
};

const uploadToServer = async (file, path, filename) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', filename);
  const uri = `${config.baseURLApi}/file/upload/${path}`;
  await Axios.post(uri, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return `${config.baseURLApi}/file/download?privateUrl=${path}/${filename}`;
};

const StepContent = ({
  activeStep,
  newUser,
  handleChange,
  handleFile,
  deleteOneImage,
  fileInput,
  classes
}) => {
  const renderAccountStep = () => (
    <>
      <TextField
        id="username-field"
        label="Username"
        name="fullName"
        onChange={handleChange}
        value={newUser.fullName || ''}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Please enter your username"
      />
      <TextField
        id="email-field"
        label="Email Address"
        name="email"
        onChange={handleChange}
        value={newUser.email || ''}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="We’ll never share your email with anyone else"
        type="email"
      />
      <TextField
        id="password-field"
        label="Password"
        name="password"
        onChange={handleChange}
        value={newUser.password || ''}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Enter your password. Min 6 characters long"
        type="password"
      />
      <FormControl variant="outlined" onChange={handleChange} style={{ marginBottom: 35 }}>
        <InputLabel id="role-select-label">Role</InputLabel>
        <Select
          labelId="role-select-label"
          id="role-select"
          name="role"
          onChange={handleChange}
          value={newUser.role || 'user'}
          label="Role"
        >
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
        <FormHelperText id="role-select-helper">Please choose the role</FormHelperText>
      </FormControl>
    </>
  );

  const renderUserDetailsStep = () => (
    <>
      <Typography weight="medium">Photo:</Typography>
      <div className={classes.galleryWrap}>
        {newUser.avatars?.length > 0 &&
          newUser.avatars.map((avatar) => (
            <div key={avatar.id} className={classes.imgWrap}>
              <span
                className={classes.deleteImageX}
                onClick={() => deleteOneImage(avatar.id)}
              >
                ×
              </span>
              <img src={avatar.publicUrl} alt="avatar" height="100%" />
            </div>
          ))}
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
        id="firstName-field"
        label="First Name"
        name="firstName"
        onChange={handleChange}
        value={newUser.firstName || ''}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Enter your first name"
      />
      <TextField
        id="lastName-field"
        label="Last Name"
        name="lastName"
        onChange={handleChange}
        value={newUser.lastName || ''}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Enter your last name"
      />
      <TextField
        id="phoneNumber-field"
        label="Contact number"
        name="phoneNumber"
        onChange={handleChange}
        value={newUser.phoneNumber || ''}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Enter your contact number"
      />
      <TextField
        id="email-display-field"
        label="Email"
        variant="outlined"
        value={newUser.email || ''}
        style={{ marginBottom: 35 }}
        helperText="Enter your email"
        type="email"
      />
      <FormControl variant="outlined" style={{ marginBottom: 35 }}>
        <InputLabel id="country-select-label">Country</InputLabel>
        <Select
          labelId="country-select-label"
          id="country-select"
          value=""
          label="Country"
        >
          <MenuItem value={10}>User</MenuItem>
          <MenuItem value={20}>Admin</MenuItem>
          <MenuItem value={30}>Super Admin</MenuItem>
        </Select>
        <FormHelperText id="country-select-helper">Choose your country</FormHelperText>
      </FormControl>
      <FormControl variant="outlined" style={{ marginBottom: 35 }}>
        <InputLabel id="state-select-label">State</InputLabel>
        <Select
          labelId="state-select-label"
          id="state-select"
          value=""
          label="State"
        >
          <MenuItem value={10}>User</MenuItem>
          <MenuItem value={20}>Admin</MenuItem>
          <MenuItem value={30}>Super Admin</MenuItem>
        </Select>
        <FormHelperText id="state-select-helper">Choose your state</FormHelperText>
      </FormControl>
      <FormControl variant="outlined" style={{ marginBottom: 35 }}>
        <InputLabel id="city-select-label">City</InputLabel>
        <Select
          labelId="city-select-label"
          id="city-select"
          value=""
          label="City"
        >
          <MenuItem value={10}>User</MenuItem>
          <MenuItem value={20}>Admin</MenuItem>
          <MenuItem value={30}>Super Admin</MenuItem>
        </Select>
        <FormHelperText id="city-select-helper">Choose your city</FormHelperText>
      </FormControl>
      <TextField
        id="address-field"
        label="Address"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your address"
      />
    </>
  );

  const renderBusinessDetailsStep = () => (
    <>
      <TextField
        id="companyName-field"
        label="Company Name"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your company name"
      />
      <TextField
        id="companyRegisteredId-field"
        label="Company Registered ID"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your company registered ID"
      />
      <TextField
        id="companyEmail-field"
        label="Company Email"
        onChange={handleChange}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Enter your company email"
      />
      <TextField
        id="companyContact-field"
        label="Company Contact"
        onChange={handleChange}
        variant="outlined"
        style={{ marginBottom: 35 }}
        helperText="Enter your company contact"
      />
    </>
  );

  const renderSocialStep = () => (
    <>
      <TextField
        id="facebook-field"
        label="Facebook"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your Facebook link"
      />
      <TextField
        id="twitter-field"
        label="Twitter"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your Twitter link"
      />
      <TextField
        id="instagram-field"
        label="Instagram"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your Instagram link"
      />
      <TextField
        id="github-field"
        label="GitHub"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your GitHub link"
      />
      <TextField
        id="codepen-field"
        label="CodePen"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your CodePen link"
      />
      <TextField
        id="slack-field"
        label="Slack"
        variant="outlined"
        onChange={handleChange}
        style={{ marginBottom: 35 }}
        helperText="Enter your Slack link"
      />
    </>
  );

  switch (activeStep) {
    case 0:
      return renderAccountStep();
    case 1:
      return renderUserDetailsStep();
    case 2:
      return renderBusinessDetailsStep();
    case 3:
      return renderSocialStep();
    default:
      return null;
  }
};

const StepNavigation = ({ activeStep, steps, handleNext, handleBack }) => {
  if (activeStep === 0) {
    return (
      <Box display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={handleNext}>
          Next
        </Button>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="space-between">
      <Button onClick={handleBack} variant="outlined" color="primary">
        Back
      </Button>
      <Button variant="contained" color="primary" onClick={handleNext}>
        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
      </Button>
    </Box>
  );
};

const AddUser = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const managementDispatch = useManagementDispatch();

  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const fileInput = React.useRef(null);

  const [newUser, setNewUser] = React.useState({
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

  const isStepSkipped = React.useCallback(
    (step) => skipped.has(step),
    [skipped]
  );

  const handleChange = React.useCallback((e) => {
    setNewUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleFile = React.useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const extension = extractExtensionFrom(file.name);
      const id = uuid();
      const filename = `${id}.${extension}`;
      const privateUrl = `users/avatar/${filename}`;

      const publicUrl = await uploadToServer(file, 'users/avatar', filename);

      setNewUser((prev) => ({
        ...prev,
        avatars: [
          ...prev.avatars,
          {
            id,
            name: file.name,
            sizeInBytes: file.size,
            privateUrl,
            publicUrl,
            new: true,
          },
        ],
      }));
    },
    []
  );

  const deleteOneImage = React.useCallback((id) => {
    setNewUser((prev) => ({
      ...prev,
      avatars: prev.avatars.filter((avatar) => avatar.id !== id),
    }));
  }, []);

  const sendNotification = React.useCallback(() => {
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
  }, [classes.progress, classes.notification, classes.notificationComponent]);

  const doSubmit = React.useCallback(
    (id, data) => {
      actions.doCreate(data, navigate)(managementDispatch);
    },
    [navigate, managementDispatch]
  );

  const handleNext = React.useCallback(() => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);

    if (activeStep === 3) {
      doSubmit(null, newUser);
      sendNotification();
    }
  }, [activeStep, skipped, isStepSkipped, doSubmit, newUser, sendNotification]);

  const handleBack = React.useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Widget>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label, index) => {
              const stepProps = {};
              const labelProps = {};
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel {...labelProps} classes={{ completed: classes.stepCompleted }}>
                    {label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Widget>
      </Grid>

      <Grid item xs={12}>
        <Widget>
          <Grid container justify="center">
            <Box display="flex" flexDirection="column" width={600}>
              <Typography variant="h5" weight="medium" style={{ marginBottom: 30 }}>
                {STEP_CONTENT[activeStep]}
              </Typography>

              <StepContent
                activeStep={activeStep}
                newUser={newUser}
                handleChange={handleChange}
                handleFile={handleFile}
                deleteOneImage={deleteOneImage}
                fileInput={fileInput}
                classes={classes}
              />

              <StepNavigation
                activeStep={activeStep}
                steps={STEPS}
                handleNext={handleNext}
                handleBack={handleBack}
              />
            </Box>
          </Grid>
        </Widget>
      </Grid>
    </Grid>
  );
};

export default AddUser;