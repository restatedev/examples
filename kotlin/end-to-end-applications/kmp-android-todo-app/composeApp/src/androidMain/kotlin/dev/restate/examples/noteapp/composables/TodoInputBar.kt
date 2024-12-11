package dev.restate.examples.noteapp.composables

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import dev.restate.examples.noteapp.ui.constants.LargeDp
import dev.restate.examples.noteapp.ui.constants.MediumDp
import dev.restate.examples.noteapp.ui.constants.TodoInputBarBackgroundColor
import dev.restate.examples.noteapp.ui.constants.TodoInputBarFabColor
import dev.restate.examples.noteapp.ui.constants.TodoInputBarFabSize
import dev.restate.examples.noteapp.ui.constants.TodoInputBarHeight
import dev.restate.examples.noteapp.ui.constants.TodoInputBarTextStyle
import dev.restate.examples.noteapp.R

@Composable
fun TodoInputBar(
    modifier: Modifier = Modifier,
    onAddButtonClick: (String) -> Unit = {}
) {
    // 1. State Management
    val input = remember { mutableStateOf("") }

    Card(
        // 2. Shape Customization
        shape = RoundedCornerShape(size = MediumDp),
        modifier = modifier
            .padding(MediumDp)
            .height(TodoInputBarHeight)
            .fillMaxWidth(),
        // 3. Elevation for Depth
        elevation = CardDefaults.cardElevation(defaultElevation = LargeDp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(color = TodoInputBarBackgroundColor),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextField(
                modifier = Modifier.weight(1f),
                textStyle = TodoInputBarTextStyle,
                // 4. Data Binding
                value = input.value,
                // 5. Event Handling
                onValueChange = { newText -> input.value = newText },
                placeholder = {
                    Text(
                        text = stringResource(id = R.string.todo_input_bar_hint),
                        // 6. Text Styling Depending on TodoItem Status
                        style = TodoInputBarTextStyle.copy(color = Color.White.copy(alpha = 0.5f))
                    )
                },
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    // 7. Custom TextField Appearance
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    cursorColor = Color.White,
                    disabledTextColor = Color.White,
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                )
            )
            FloatingActionButton(
                containerColor = TodoInputBarFabColor,
                onClick = {
                    // 8. Task Submission Logic
                    if (input.value.isEmpty()) return@FloatingActionButton
                    onAddButtonClick(input.value)
                    input.value = ""
                },
                // 9. FAB Customization
                shape = CircleShape,
                modifier = Modifier.size(TodoInputBarFabSize),
                elevation = FloatingActionButtonDefaults.elevation(
                    defaultElevation = 0.dp,
                    pressedElevation = 0.dp
                )
            ) {
                Icon(
                    painter = painterResource(id = R.drawable.ic_add),
                    contentDescription = null,
                    tint = TodoInputBarBackgroundColor
                )
            }
            Spacer(modifier = Modifier.width(LargeDp))
        }
    }
}

@Preview
@Composable
fun TodoInputBarPreview() {
    TodoInputBar()
}