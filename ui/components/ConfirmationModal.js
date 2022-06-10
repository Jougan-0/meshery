import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
  Tooltip, Typography, Checkbox, IconButton
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { closeButtonForSnackbarAction, errorHandlerGenerator, hideProgress, showProgress, successHandlerGenerator } from "./ConnectionWizard/helpers/common";
import { pingKubernetes } from "./ConnectionWizard/helpers/kubernetesHelpers";
import { useSnackbar, withSnackbar } from "notistack";
import { Search } from "@material-ui/icons";
import { useEffect, useState } from "react";
import { bindActionCreators } from "redux";
import { updateProgress } from "../lib/store";
import CloseIcon from "@material-ui/icons/Close";

const styles = (theme) => ({
  icon : {
    display : 'inline',
    verticalAlign : 'text-top',
    width : theme.spacing(1.75),
    marginLeft : theme.spacing(0.5),
  },
  chip : {
    height : "50px",
    fontSize : "15px",
    position : "relative",
    top : theme.spacing(0.5),
    [theme.breakpoints.down("md")] : { fontSize : "12px", },
  },

  ctxChip : {
    backgroundColor : "white",
    cursor : "pointer",
    marginRight : theme.spacing(1),
    marginLeft : theme.spacing(1),
    marginBottom : theme.spacing(1),
    height : "100%",
    padding : theme.spacing(0.5)
  },
  ctxIcon : {
    display : 'inline',
    verticalAlign : 'text-top',
    width : theme.spacing(2.5),
    marginLeft : theme.spacing(0.5),
  },
  title : {
    textAlign : 'center',
    minWidth : 400,
    padding : '10px',
    color : '#fff',
    backgroundColor : '#607d8b'
  },
  subtitle : {
    minWidth : 400,
    overflowWrap : 'anywhere',
    textAlign : 'center',
    padding : '5px'
  },
  button0 : {
    margin : theme.spacing(0.5),
    padding : theme.spacing(1),
    borderRadius : 5,
    minWidth : 100,
  },
  button1 : {
    margin : theme.spacing(0.5),
    padding : theme.spacing(1),
    borderRadius : 5,
    backgroundColor : "#e0e0e0",
    color : "rgba(0, 0, 0, 0.87)",
    "&:hover" : {
      backgroundColor : "#d5d5d5",
      boxShadow : "0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%)"
    },
    minWidth : 100,
  },
  actions : {
    display : 'flex',
    justifyContent : 'space-evenly',
  },
  all : {
    display : "table"
  },
  contexts : {
    display : "flex",
    flexWrap : "wrap"
  }
})

function ConfirmationMsg(props) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { classes, open, handleClose, submit, category,
    operation, isDelete, activeContexts, setContextViewer,
    selectedK8sContexts, k8scontext } = props
  const [context, setContext] = useState(k8scontext)

  useEffect(() => {
    setContext(activeContexts)
  }, [activeContexts])

  const handleKubernetesClick = () => {
    showProgress()
    pingKubernetes(
      successHandlerGenerator(enqueueSnackbar, closeButtonForSnackbarAction(closeSnackbar), "Kubernetes succesfully pinged", () => hideProgress()),
      errorHandlerGenerator(enqueueSnackbar, closeButtonForSnackbarAction(closeSnackbar), "Kubernetes not pinged successfully", () => hideProgress())
    )
  }

  const searchContexts = (search) => {
    const matchedCtx = k8scontext.filter((ctx) => ctx.name.includes(search))
    let matchedCtxID = [];
    matchedCtx.forEach(ctx => {
      matchedCtxID.push(ctx.id);
    });
    setContext(matchedCtx)
  }
  console.log(context, "state")
  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className={classes.dialogBox}
      >
        {selectedK8sContexts.length > 0
          ?
          <>
        <DialogTitle id="alert-dialog-title" className={classes.title}>
          <b>{"The selected operation will be applied to following contexts."}</b>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" className={classes.subtitle}>
              <Typography variant="body1">
                <div>
                  <TextField
                    id="search-ctx"
                    label="Search"
                    size="small"
                    variant="outlined"
                    onChange={(event) => searchContexts(event.target.value)}
                    style={{ width : "100%", backgroundColor : "rgba(102, 102, 102, 0.12)", margin : "1px 1px 8px " }}
                    InputProps={{
                      endAdornment : (
                        <Search />
                      )
                    }}
                  />
                </div>
                <div className={classes.all}>
                  <Checkbox
                    checked={selectedK8sContexts.includes("all")}
                    onChange={() => setContextViewer("all")}
                    color="primary"
                  />
                  <span>Select All</span>
                </div>
                <div className={classes.contexts}>
                  {context.map((ctx) => (
                    <div id={ctx.id} className={classes.chip}>
                      <Tooltip title={`Server: ${ctx.server}`}>
                        <div style={{ display : "flex", justifyContent : "flex-wrap", alignItems : "center" }}>
                          <Checkbox
                            checked={activeContexts.filter(c => c.id === ctx.id).length > 0}
                            onChange={() => setContextViewer(ctx.id)}
                            color="primary"
                          />
                          <Chip
                            label={ctx.name}
                            className={classes.ctxChip}
                            onClick={handleKubernetesClick}
                            icon={<img src="/static/img/kubernetes.svg" className={classes.ctxIcon} />}
                            variant="outlined"
                            data-cy="chipContextName"
                          />
                        </div>

                      </Tooltip>
                    </div>
                  ))}
                </div>
              </Typography>    
          </DialogContentText>
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button onClick={handleClose} className={classes.button1}>
            <Typography variant body2> Cancel </Typography>
          </Button>
          <Button onClick={() => submit(category, operation, isDelete)}
            className={classes.button0} autoFocus type="submit"
            variant="contained"
            color="primary">
            <Typography variant body2 > DEPLOY </Typography>
          </Button>
        </DialogActions>
        </>
      : 
        enqueueSnackbar(`Please select Kubernets context before proceeding with the deployment`, {
          variant : "info",
          action : (key) => (
            <IconButton key="close" aria-label="close" color="inherit" onClick={() => closeSnackbar(key)}>
              <CloseIcon />
            </IconButton>
          ),
          autohideduration : 2000,
        })
      }
      </Dialog>
    </div>
  )
}

const mapStateToProps = state => {
  const selectedK8sContexts = state.get('selectedK8sContexts');
  return { selectedK8sContexts : selectedK8sContexts };
}

const mapDispatchToProps = (dispatch) => ({
  updateProgress : bindActionCreators(updateProgress, dispatch)
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withSnackbar(ConfirmationMsg)));