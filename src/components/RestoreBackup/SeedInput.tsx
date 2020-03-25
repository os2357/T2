import React, { useState, Fragment } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Chip from '@material-ui/core/Chip';
import CloseIcon from '@material-ui/icons/Close';

import seedJson from './seed.json';

const ChipWrapper = styled(Chip)<{ isbad: number }>`
  &&& {
    font-size: 14px;
    border: solid 1px rgba(181, 197, 227, 0.35);
    height: 24px;
    font-weight: 300;
    .MuiChip-label {
      line-height: 20px;
    }
    background-color: ${({ theme: { colors }, isbad }) => (isbad ? '#f6d6d6' : colors.gray2)};
  }
`;

const IndexSpan = styled.span`
  color: ${({ theme: { colors } }) => colors.index0};
  font-size: 13px;
  margin-right: 4px;
`;

const TextfieldWrapper = styled(TextField)`
  &&& {
    &.MuiTextField-root {
      font-weight: 300;
    }
  }
`;

const ChipContent = ({ value, index }) => {
  return (
    <Fragment>
      <IndexSpan>{index + 1}</IndexSpan>
      {value}
    </Fragment>
  );
};

interface Props {
  seeds: string[];
  placeholder: string;
  onChange: (seeds: string[]) => void;
  onError: (isError: boolean) => void;
}

function SeedInput(props: Props) {
  const { seeds, placeholder, onChange, onError } = props;
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [badWords, setBadWords] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');

  function seedPhraseConvert(seedStr: string): string[] {
    if (seedStr.indexOf('"') > -1 || seedStr.indexOf(',') > -1) {
      const words = seedStr.replace(/["\s]/g, '');
      const seedString = words.replace(/,/g, ' ');
      return seedString.split(/\s+/);
    }
    return seedStr.trim().split(/\s+/);
  }

  function onChangeInput(e, val) {
    let newError = error;
    let newVal = val;
    if (!val) {
      newError = seeds.length > 15 || badWords.length > 0 ? error : '';
    } else if (val.length > 15) {
      newVal = '';
      const inputedSeeds = seedPhraseConvert(val);
      const newBadWords = inputedSeeds.filter(element => seedJson.indexOf(element) === -1);
      const newSeeds = [...seeds, ...inputedSeeds];

      if (newSeeds.length > 15) {
        newError = t('containers.homeAddAddress.errors.invalid_length');
      } else if (newBadWords.length > 0) {
        const realBadWords = [...badWords, ...newBadWords];
        setBadWords(realBadWords);
        newError = t('containers.homeAddAddress.errors.invalid_words');
      }
      onChange(newSeeds);
    } else {
      if (seeds.length > 15) {
        newError = t('containers.homeAddAddress.errors.invalid_length');
      } else if (!error) {
        const seedIndex = seedJson.indexOf(val);
        if (seedIndex > -1) {
          newError = t('containers.homeAddAddress.errors.invalid_length');
        }
      }
    }
    setError(newError);
    setInputVal(newVal);
    onError(!!newError);
  }

  function onChangeItems(e, items) {
    const newBadWords = badWords.filter(item => items.indexOf(item) > -1);
    let newError = '';
    if (items.length > 15) {
      newError = t('containers.homeAddAddress.errors.invalid_length');
    } else if (newBadWords.length > 0) {
      newError = t('containers.homeAddAddress.errors.invalid_length');
    }
    setBadWords([...newBadWords]);
    onChange(items);
    onError(!!newError);
  }

  return (
    <Autocomplete
      multiple={true}
      id="tags-standard"
      autoComplete={true}
      autoHighlight={true}
      options={seedJson}
      closeIcon=""
      popupIcon=""
      disableOpenOnFocus={true}
      filterSelectedOptions={true}
      inputValue={inputVal}
      value={seeds}
      onInputChange={onChangeInput}
      onChange={onChangeItems}
      filterOptions={(options, state) => {
        const { inputValue } = state;
        if (inputValue.length < 2) {
          return [];
        }
        return options.filter(option => {
          return option.toLowerCase().startsWith(inputValue.toLowerCase());
        });
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const isBad = badWords.indexOf(option) > -1 ? 1 : 0;
          return (
            <ChipWrapper
              key={index}
              variant="outlined"
              color="primary"
              size="small"
              isbad={isBad}
              label={<ChipContent value={option} index={index} />}
              deleteIcon={<CloseIcon />}
              {...getTagProps({ index })}
            />
          );
        })
      }
      renderInput={params => (
        <TextfieldWrapper
          {...params}
          variant="standard"
          placeholder={placeholder}
          margin="normal"
          fullWidth={true}
          error={!!error}
          helperText={error}
        />
      )}
    />
  );
}

export default SeedInput;
