/* eslint-disable import/no-unresolved */
import { Card, CardContent } from "@/components/ui/card"

interface LinearProcessFlowProps {
  children: string
}

export function LinearProcessFlow({ children }: LinearProcessFlowProps) {
  const steps = children.split('###').filter(step => step.trim() !== '')

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const lines = step.split('\n').filter(line => line.trim() !== '')
        const title = lines[0] ? lines[0].trim() : "Untitled Step"
        const content = lines.slice(1)

        return (
          <Card key={index}>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">{title.trim()}</h3>
              <div className="prose prose-sm">
                {content.map((line, i) => (
                  <p key={i}>{line.trim()}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}