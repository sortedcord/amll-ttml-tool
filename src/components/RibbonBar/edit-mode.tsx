/*
 * Copyright 2023-2023 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 AMLL TTML Tool 项目的一部分。
 * This source code file is a part of AMLL TTML Tool project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/Steve-xmh/amll-ttml-tool/blob/main/LICENSE
 */

import {
	lyricLinesAtom,
	selectedLinesAtom,
	selectedWordsAtom,
} from "$/states/main.ts";
import { msToTimestamp, parseTimespan } from "$/utils/timestamp.ts";
import {
	type LyricLine,
	type LyricWord,
	newLyricLine,
} from "$/utils/ttml-types.ts";
import { Button, Checkbox, Grid, Text, TextField } from "@radix-ui/themes";
import { useAtomValue, useSetAtom } from "jotai";
import { useSetImmerAtom } from "jotai-immer";
import { type FC, forwardRef, useLayoutEffect, useMemo, useState } from "react";
import { RibbonFrame, RibbonSection } from "./common";

function EditField<
	L extends Word extends true ? LyricWord : LyricLine,
	F extends keyof L,
	Word extends boolean | undefined = undefined,
>({
	label,
	isWordField,
	fieldName,
	formatter,
	parser,
	textFieldStyle,
}: {
	label: string;
	isWordField?: Word;
	fieldName: F;
	formatter: (v: L[F]) => string;
	parser: (v: string) => L[F];
	textFieldStyle?: React.CSSProperties;
}) {
	const [fieldInput, setFieldInput] = useState<string | undefined>(undefined);
	const [fieldPlaceholder, setFieldPlaceholder] = useState<string>("");
	const itemAtom = useMemo(
		() => (isWordField ? selectedWordsAtom : selectedLinesAtom),
		[isWordField],
	);
	const selectedItems = useAtomValue(itemAtom);

	const lyricLines = useAtomValue(lyricLinesAtom);
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);

	const currentValue = useMemo(() => {
		if (selectedItems.size) {
			if (isWordField) {
				const selectedWords = selectedItems as Set<string>;
				const values = new Set();
				for (const line of lyricLines.lyricLines) {
					for (const word of line.words) {
						if (selectedWords.has(word.id)) {
							values.add(word[fieldName as keyof LyricWord]);
						}
					}
				}
				if (values.size === 1)
					return {
						multiplieValues: false,
						value: formatter(values.values().next().value as L[F]),
					} as const;
				return {
					multiplieValues: true,
					value: "",
				} as const;
			}
			const selectedLines = selectedItems as Set<string>;
			const values = new Set();
			for (const line of lyricLines.lyricLines) {
				if (selectedLines.has(line.id)) {
					values.add(line[fieldName as keyof LyricLine]);
				}
			}
			if (values.size === 1)
				return {
					multiplieValues: false,
					value: formatter(values.values().next().value as L[F]),
				} as const;
			return {
				multiplieValues: true,
				value: "",
			} as const;
		}
		return undefined;
	}, [selectedItems, fieldName, formatter, isWordField, lyricLines]);

	useLayoutEffect(() => {
		setFieldInput(currentValue?.value);
		if (currentValue?.multiplieValues) {
			setFieldPlaceholder("Multiple Values...");
		} else {
			setFieldPlaceholder("");
		}
	}, [currentValue]);

	return (
		<>
			<Text wrap="nowrap" size="1">
				{label}
			</Text>
			<TextField.Root
				size="1"
				style={{ width: "8em", ...textFieldStyle }}
				value={fieldInput ?? ""}
				placeholder={fieldPlaceholder}
				disabled={fieldInput === undefined}
				onChange={(evt) => setFieldInput(evt.target.value)}
				onKeyDown={(evt) => {
					if (evt.key !== "Enter") return;
					try {
						const value = parser(evt.currentTarget.value);
						editLyricLines((state) => {
							for (const line of state.lyricLines) {
								if (isWordField) {
									for (const word of line.words) {
										if (selectedItems.has(word.id)) {
											(word as L)[fieldName] = value;
										}
									}
								} else {
									if (selectedItems.has(line.id)) {
										(line as L)[fieldName] = value;
									}
								}
							}
							return state;
						});
					} catch {
						setFieldInput(currentValue?.value);
					}
				}}
				onBlur={(evt) => {
					if (evt.target.value === currentValue?.value) return;
					try {
						const value = parser(evt.target.value);
						editLyricLines((state) => {
							for (const line of state.lyricLines) {
								if (isWordField) {
									for (const word of line.words) {
										if (selectedItems.has(word.id)) {
											(word as L)[fieldName] = value;
										}
									}
								} else {
									if (selectedItems.has(line.id)) {
										(line as L)[fieldName] = value;
									}
								}
							}
							return state;
						});
					} catch {
						setFieldInput(currentValue?.value);
					}
				}}
			/>
		</>
	);
}

function CheckboxField<
	L extends Word extends true ? LyricWord : LyricLine,
	F extends keyof L,
	V extends L[F] extends boolean ? boolean : never,
	Word extends boolean | undefined = undefined,
>({
	label,
	isWordField,
	fieldName,
	defaultValue,
}: {
	label: string;
	isWordField: Word;
	fieldName: F;
	defaultValue: V;
}) {
	const itemAtom = useMemo(
		() => (isWordField ? selectedWordsAtom : selectedLinesAtom),
		[isWordField],
	);
	const selectedItems = useAtomValue(itemAtom);

	const lyricLines = useAtomValue(lyricLinesAtom);
	const editLyricLines = useSetImmerAtom(lyricLinesAtom);

	const currentValue = useMemo(() => {
		if (selectedItems.size) {
			if (isWordField) {
				const selectedWords = selectedItems as Set<string>;
				const values = new Set();
				for (const line of lyricLines.lyricLines) {
					for (const word of line.words) {
						if (selectedWords.has(word.id)) {
							values.add(word[fieldName as keyof LyricWord]);
						}
					}
				}
				if (values.size === 1)
					return {
						multipleValues: false,
						value: values.values().next().value as L[F],
					} as const;
				return {
					multipleValues: true,
					value: "",
				} as const;
			}
			const selectedLines = selectedItems as Set<string>;
			const values = new Set();
			for (const line of lyricLines.lyricLines) {
				if (selectedLines.has(line.id)) {
					values.add(line[fieldName as keyof LyricLine]);
				}
			}
			if (values.size === 1)
				return {
					multipleValues: false,
					value: values.values().next().value as L[F],
				} as const;
			return {
				multipleValues: true,
				value: "",
			} as const;
		}
		return undefined;
	}, [selectedItems, fieldName, isWordField, lyricLines]);

	return (
		<>
			<Text wrap="nowrap" size="1">
				{label}
			</Text>
			<Checkbox
				disabled={selectedItems.size === 0}
				checked={
					currentValue
						? currentValue.multipleValues
							? "indeterminate"
							: (currentValue.value as boolean)
						: defaultValue
				}
				onCheckedChange={(value) => {
					if (value === "indeterminate") return;
					editLyricLines((state) => {
						for (const line of state.lyricLines) {
							if (isWordField) {
								for (const word of line.words) {
									if (selectedItems.has(word.id)) {
										(word as L)[fieldName] = value as L[F];
									}
								}
							} else {
								if (selectedItems.has(line.id)) {
									(line as L)[fieldName] = value as L[F];
								}
							}
						}
						return state;
					});
				}}
			/>
		</>
	);
}

export const EditModeRibbonBar: FC = forwardRef<HTMLDivElement>(
	(_props, ref) => {
		const editLyricLines = useSetAtom(lyricLinesAtom);

		return (
			<RibbonFrame ref={ref}>
				<RibbonSection label="New">
					<Grid columns="1" gap="1" gapY="1" flexGrow="1" align="center">
						<Button
							size="1"
							variant="soft"
							onClick={() =>
								editLyricLines((prev) => {
									return {
										...prev,
										lyricLines: [...prev.lyricLines, newLyricLine()],
									};
								})
							}
						>
							歌词行
						</Button>
					</Grid>
				</RibbonSection>
				<RibbonSection label="Line Timestamp">
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label="Start Time"
							fieldName="startTime"
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label="End Time"
							fieldName="endTime"
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label="Line Properties">
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<CheckboxField
							label="Background Vocal"
							isWordField={false}
							fieldName="isBG"
							defaultValue={false}
						/>
						<CheckboxField
							label="Duet Vocal"
							isWordField={false}
							fieldName="isDuet"
							defaultValue={false}
						/>
						<CheckboxField
							label="Ignore sync"
							isWordField={false}
							fieldName="ignoreSync"
							defaultValue={false}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label="Timestamps">
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label="Start Time"
							fieldName="startTime"
							isWordField
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label="End Time"
							fieldName="endTime"
							isWordField
							parser={parseTimespan}
							formatter={msToTimestamp}
						/>
						<EditField
							label="Empty Beat"
							fieldName="emptyBeat"
							isWordField
							parser={Number.parseInt}
							formatter={String}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label="Word Attribs">
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label="Word content"
							fieldName="word"
							isWordField
							parser={(v) => v}
							formatter={(v) => v}
						/>
						<CheckboxField
							label="is expliti"
							isWordField
							fieldName="obscene"
							defaultValue={false}
						/>
					</Grid>
				</RibbonSection>
				<RibbonSection label="Secondary">
					<Grid columns="0fr 1fr" gap="2" gapY="1" flexGrow="1" align="center">
						<EditField
							label="Translated Lyric"
							fieldName="translatedLyric"
							parser={(v) => v}
							formatter={(v) => v}
							textFieldStyle={{ width: "20em" }}
						/>
						<EditField
							label="Roman Lyric"
							fieldName="romanLyric"
							parser={(v) => v}
							formatter={(v) => v}
							textFieldStyle={{ width: "20em" }}
						/>
					</Grid>
				</RibbonSection>
			</RibbonFrame>
		);
	},
);

export default EditModeRibbonBar;
