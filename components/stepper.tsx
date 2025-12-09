import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Step {
  label: string;
  completed: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = step.completed;
          const isLast = index === steps.length - 1;

          return (
            <View key={index} style={styles.stepWrapper}>
              <View style={styles.stepCircleRow}>
                <View>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isActive && styles.stepCircleActive,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumber,
                          isActive && styles.stepNumberActive,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      (isActive || isCompleted) && styles.stepLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    {step.label}
                  </Text>
                </View>

                {/* Connector Line */}
                {!isLast && (
                  <View
                    style={[
                      styles.connector,
                      isCompleted && styles.connectorCompleted,
                    ]}
                  />
                )}
              </View>

              {/* Step Label */}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  stepWrapper: {
    alignItems: "center",
  },
  stepCircleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleCompleted: {
    backgroundColor: "#8B1A1A",
  },
  stepCircleActive: {
    backgroundColor: "#8B1A1A",
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#999",
  },
  stepNumberActive: {
    color: "#fff",
  },
  connector: {
    width: 80,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  connectorCompleted: {
    backgroundColor: "#8B1A1A",
  },
  stepLabel: {
    fontSize: 12,
    color: "#000",
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 100,
    position: "absolute",
    top: 45,
    width: 80,
    left: -20,
  },
  stepLabelActive: {
    color: "#8B1A1A",
    fontWeight: "700",
  },
});
