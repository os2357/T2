import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import styled from 'styled-components';
import themes from '../../styles/theme';

const styles: any = {
  cssContainer: {
    width: '100%'
  },
  cssLabel: {
    color: themes.colors.gray15,
    zIndex: 10,
    fontSize: '16px',
    pointerEvents: 'none',
    '&$cssFocused': {
      color: themes.colors.gray3
    }
  },
  cssFormControl: {
    transform: 'translate(22px, 34px) scale(1)'
  },
  cssShrink: {
    transform: 'translate(0, 1.5px) scale(0.75)'
  },
  cssFocused: {},
  cssInput: {
    backgroundColor: themes.colors.gray14,
    border: `1px solid ${themes.colors.gray14}`,
    fontSize: '14px',
    color: themes.colors.blue5,
    padding: '10px 22px 5px 22px'
  },
  cssText: {
    color: themes.colors.error1,
    fontSize: '12px',
    marginTop: '5px',
    lineHeight: '18px',
    height: '18px'
  }
};

const LabelWrapper = styled(InputLabel)`
  &&& {
    &.MuiInputLabel-root {
      z-index: 10;
      transform: translate(22px, 34px) scale(1);
      font-size: 16px;
    }
    &.Mui-focused {
      color: ${({ theme: { colors } }) => colors.gray3};
    }
    &.MuiInputLabel-shrink {
      transform: translate(0, 1.5px) scale(0.75);
    }
  }
`;

const FormControlWrapper = styled(FormControl)`
  width: 100%;
`;

const InputWrapper = styled(Input)`
  &&& {
    &.MuiInput-root {
      background-color: ${({ theme: { colors } }) => colors.gray14};
      border: 1px solid ${({ theme: { colors } }) => colors.gray14};
      padding: 10px 22px 5px 22px;
      font-size: 14px;
      color: ${({ theme: { colors } }) => colors.blue5};
    }
  }
`;

const ErrorWrapper = styled(FormHelperText)`
  &&& {
    color: ${({ theme: { colors } }) => colors.error1};
    font-size: 12px;
    margin-top: 5px;
    line-height: 18px;
    height: 18px;
  }
`;

interface Props {
  label: string;
  errorText?: string | React.ReactNode;
  onChange: (val: string) => void;
  classes: any;
}

const CustomTextArea = (props: Props) => {
  const { label, onChange, errorText, classes, ...other } = props;
  return (
    <FormControlWrapper>
      <LabelWrapper htmlFor="micheline-input">{label}</LabelWrapper>
      <InputWrapper
        id="micheline-input"
        key={label}
        onChange={event => onChange(event.target.value)}
        multiline={true}
        rows={5}
        rowsMax={5}
        {...other}
      />
      <ErrorWrapper component="div">{errorText}</ErrorWrapper>
    </FormControlWrapper>
  );
};
CustomTextArea.defaultProps = {
  errorText: ''
};

export default withStyles(styles)(CustomTextArea);